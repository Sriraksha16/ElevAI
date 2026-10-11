import { randomUUID } from "crypto";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

export const runtime = "nodejs";

const PREMIUM_PRICE_PAISE = 14900;
const PREMIUM_CURRENCY = "INR";
const RAZORPAY_MODE = process.env.RAZORPAY_MODE ?? "test";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json(
        { success: false, message: "Please sign in first." },
        { status: 401 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

     const validMode =
     (RAZORPAY_MODE === "test" && keyId?.startsWith("rzp_test_")) ||
      (RAZORPAY_MODE === "live" && keyId?.startsWith("rzp_live_"));

      if (!validMode || !keySecret) {
        return Response.json(
        {
          success: false,
          message: "Razorpay test credentials are not configured.",
        },
        { status: 503 }
      );
     }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: PREMIUM_PRICE_PAISE,
      currency: PREMIUM_CURRENCY,
      receipt: `elevai_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      notes: {
        userId,
        plan: "premium_30_days",
      },
    });

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO payment_orders (
        id, user_id, order_id, amount, currency, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, 'created', ?)
    `).run(
      randomUUID(),
      userId,
      order.id,
      PREMIUM_PRICE_PAISE,
      PREMIUM_CURRENCY,
      now
    );

    return Response.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan: "premium",
      durationDays: 30,
    });
  } catch (error) {
    const details =
      error && typeof error === "object"
        ? (error as {
            message?: unknown;
            statusCode?: unknown;
            code?: unknown;
            error?: {
              code?: unknown;
              description?: unknown;
              reason?: unknown;
            };
          })
        : undefined;

    console.error("Razorpay order creation failed:", {
      message:
        error instanceof Error
          ? error.message
          : details?.message,
      statusCode: details?.statusCode,
      code: details?.code ?? details?.error?.code,
      description: details?.error?.description,
      reason: details?.error?.reason,
    });

    return Response.json(
      {
        success: false,
        message: "Unable to create a payment order.",
      },
      { status: 500 }
    );
  }
}