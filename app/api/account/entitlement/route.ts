import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

export const runtime = "nodejs";

type Entitlement = {
  plan: "free" | "premium";
  premium_started_at: string | null;
  premium_expires_at: string | null;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json(
        { success: false, message: "Please sign in first." },
        { status: 401 }
      );
    }

    const entitlement = db
      .prepare(`
        SELECT plan, premium_started_at, premium_expires_at
        FROM user_entitlements
        WHERE user_id = ?
      `)
      .get(userId) as Entitlement | undefined;

    const isPremium =
      entitlement?.plan === "premium" &&
      !!entitlement.premium_expires_at &&
      Date.parse(entitlement.premium_expires_at) > Date.now();

    return Response.json(
      {
        success: true,
        plan: isPremium ? "premium" : "free",
        premiumExpiresAt: isPremium
          ? entitlement?.premium_expires_at
          : null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Entitlement lookup failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return Response.json(
      {
        success: false,
        message: "Unable to load your Premium status.",
      },
      { status: 500 }
    );
  }
}
