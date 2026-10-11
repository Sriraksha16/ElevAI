import { createHmac, timingSafeEqual } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

export const runtime = "nodejs";

const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const PREMIUM_PRICE_PAISE = 14900;

type RequestBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type PaymentRecord = {
  user_id: string;
  order_id: string;
  payment_id: string | null;
  status: string;
  amount: number;
  currency: string;
};

type EntitlementRecord = {
  plan: string;
  premium_started_at: string | null;
  premium_expires_at: string | null;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json(
        { success: false, message: "Please sign in first." },
        { status: 401 }
      );
    }

    let body: RequestBody;

    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return Response.json(
        { success: false, message: "Invalid payment verification request." },
        { status: 400 }
      );
    }

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const mode = process.env.RAZORPAY_MODE ?? "test";

    if (!orderId || !paymentId || !signature || !keyId || !keySecret) {
      return Response.json(
        { success: false, message: "Payment verification details are incomplete." },
        { status: 400 }
      );
    }

    const validMode =
      (mode === "test" && keyId.startsWith("rzp_test_")) ||
      (mode === "live" && keyId.startsWith("rzp_live_"));

    if (!validMode) {
      return Response.json(
        { success: false, message: "Razorpay mode and API key do not match." },
        { status: 503 }
      );
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest();

    if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
      return Response.json(
        { success: false, message: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const receivedSignature = Buffer.from(signature, "hex");

    if (!timingSafeEqual(receivedSignature, expectedSignature)) {
      return Response.json(
        { success: false, message: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    // Confirm the payment directly with Razorpay.
    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
        },
        cache: "no-store",
      }
    );

    if (!paymentResponse.ok) {
      console.error("Razorpay payment lookup failed:", {
        status: paymentResponse.status,
      });

      return Response.json(
        { success: false, message: "Unable to confirm payment with Razorpay." },
        { status: 502 }
      );
    }

    const paymentDetails = (await paymentResponse.json()) as {
      id?: string;
      order_id?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };

    if (
      paymentDetails.id !== paymentId ||
      paymentDetails.order_id !== orderId ||
      paymentDetails.status !== "captured" ||
      paymentDetails.amount !== PREMIUM_PRICE_PAISE ||
      paymentDetails.currency !== "INR"
    ) {
      return Response.json(
        { success: false, message: "Payment does not match the Premium order." },
        { status: 400 }
      );
    }

    const activatePremium = db.transaction(() => {
      const existing = db.prepare(`
        SELECT user_id, order_id, payment_id, status, amount, currency
        FROM payment_orders
        WHERE order_id = ?
      `).get(orderId) as PaymentRecord | undefined;

      if (!existing || existing.user_id !== userId) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (
        existing.amount !== PREMIUM_PRICE_PAISE ||
        existing.currency !== "INR"
      ) {
        throw new Error("ORDER_AMOUNT_MISMATCH");
      }

      // Idempotency: a repeat of the same successful verification
      // must never grant another 30 days.
      if (existing.status === "paid") {
        if (existing.payment_id !== paymentId) {
          throw new Error("ORDER_ALREADY_USED");
        }

        return;
      }

      if (existing.status !== "created") {
        throw new Error("ORDER_NOT_PAYABLE");
      }

      // Read the existing entitlement inside the transaction.
      const now = new Date();
      const nowIso = now.toISOString();

      const entitlement = db.prepare(`
        SELECT plan, premium_started_at, premium_expires_at
        FROM user_entitlements
        WHERE user_id = ?
      `).get(userId) as EntitlementRecord | undefined;

      const existingExpiry =
        entitlement?.premium_expires_at
          ? Date.parse(entitlement.premium_expires_at)
          : NaN;

      const hasActivePremium =
        entitlement?.plan === "premium" &&
        Number.isFinite(existingExpiry) &&
        existingExpiry > now.getTime();

      const startedAt =
        hasActivePremium && entitlement?.premium_started_at
          ? entitlement.premium_started_at
          : nowIso;

      const expiryBase = hasActivePremium
        ? existingExpiry
        : now.getTime();

      const expiresAt = new Date(
        expiryBase + PREMIUM_DURATION_MS
      ).toISOString();

      db.prepare(`
        INSERT INTO user_entitlements (
          user_id, plan, premium_started_at, premium_expires_at, updated_at
        )
        VALUES (?, 'premium', ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          plan = 'premium',
          premium_started_at = excluded.premium_started_at,
          premium_expires_at = excluded.premium_expires_at,
          updated_at = excluded.updated_at
      `).run(userId, startedAt, expiresAt, nowIso);

      const updateResult = db.prepare(`
        UPDATE payment_orders
        SET status = 'paid', payment_id = ?, paid_at = ?
        WHERE order_id = ? AND user_id = ? AND status = 'created'
      `).run(paymentId, nowIso, orderId, userId);

      if (updateResult.changes !== 1) {
        throw new Error("ORDER_STATE_CHANGED");
      }
    });

    try {
      activatePremium.immediate();
    } catch (error) {
      const code = error instanceof Error ? error.message : "";

      if (code === "ORDER_NOT_FOUND") {
        return Response.json(
          { success: false, message: "Order not found for this account." },
          { status: 404 }
        );
      }

      if (code === "ORDER_AMOUNT_MISMATCH") {
        return Response.json(
          { success: false, message: "Order amount is invalid." },
          { status: 400 }
        );
      }

      if (code === "ORDER_ALREADY_USED") {
        return Response.json(
          { success: false, message: "This order has already been used." },
          { status: 409 }
        );
      }

      if (
        code === "ORDER_NOT_PAYABLE" ||
        code === "ORDER_STATE_CHANGED"
      ) {
        return Response.json(
          { success: false, message: "This order cannot be applied again." },
          { status: 409 }
        );
      }

      throw error;
    }

    return Response.json({
      success: true,
      message: "Payment verified. Premium access is active for 30 days.",
    });
  } catch (error) {
    console.error(
      "Razorpay payment verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return Response.json(
      { success: false, message: "Payment verification failed." },
      { status: 500 }
    );
  }
}