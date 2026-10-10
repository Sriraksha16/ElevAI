
import { randomUUID } from "crypto";
import db from "@/lib/db";

export const AI_LIMITS = {
  free: {
    resumeAnalysis: 2,
    careerInsights: 1,
    jobMatch: 3,
    coverLetter: 2,
    interviewPreparation: 1,
  },
  premium: {
    resumeAnalysis: 30,
    careerInsights: 15,
    jobMatch: 30,
    coverLetter: 20,
    interviewPreparation: 15,
  },
} as const;

export type AiFeature = keyof typeof AI_LIMITS.free;

type Entitlement = {
  plan: string;
  premium_started_at: string | null;
  premium_expires_at: string | null;
};

type UsageCount = {
  used: number;
};

type Plan = "free" | "premium";

function getEntitlement(userId: string): Entitlement {
  const row = db
    .prepare(`
      SELECT plan, premium_started_at, premium_expires_at
      FROM user_entitlements
      WHERE user_id = ?
    `)
    .get(userId) as Entitlement | undefined;

  return row ?? {
    plan: "free",
    premium_started_at: null,
    premium_expires_at: null,
  };
}

function isPremium(
  entitlement: Entitlement,
  now: Date
): boolean {
  if (
    entitlement.plan !== "premium" ||
    !entitlement.premium_expires_at
  ) {
    return false;
  }

  const expiresAt = Date.parse(
    entitlement.premium_expires_at
  );

  return (
    Number.isFinite(expiresAt) &&
    expiresAt > now.getTime()
  );
}

function getPeriodKey(
  entitlement: Entitlement,
  premium: boolean,
  now: Date
): string {
  if (premium) {
    const premiumStart =
      entitlement.premium_started_at ??
      entitlement.premium_expires_at;

    return `premium:${premiumStart}`;
  }

  const month = String(
    now.getUTCMonth() + 1
  ).padStart(2, "0");

  return `free:${now.getUTCFullYear()}-${month}`;
}

function getResetAt(
  premium: boolean,
  entitlement: Entitlement,
  now: Date
): string {
  if (
    premium &&
    entitlement.premium_expires_at
  ) {
    return entitlement.premium_expires_at;
  }

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1
    )
  ).toISOString();
}

export function reserveAiUsage(
  userId: string,
  feature: AiFeature
):
  | {
      allowed: true;
      reservationId: string;
      plan: Plan;
      used: number;
      limit: number;
      remaining: number;
      resetsAt: string;
    }
  | {
      allowed: false;
      plan: Plan;
      used: number;
      limit: number;
      remaining: 0;
      resetsAt: string;
    } {
  const now = new Date();

  // Keep entitlement lookup, usage count and reservation
  // in one SQLite transaction to reduce race conditions.
  const reserve = db.transaction(() => {
    const entitlement = getEntitlement(userId);
    const premium = isPremium(entitlement, now);
    const plan: Plan = premium ? "premium" : "free";

    const limit = AI_LIMITS[plan][feature];

    const periodKey = getPeriodKey(
      entitlement,
      premium,
      now
    );

    // Both active reservations and completed generations
    // count toward the limit. Failed requests must explicitly
    // release their reservation.
    const result = db
      .prepare(`
        SELECT COUNT(*) AS used
        FROM ai_usage
        WHERE user_id = ?
          AND feature = ?
          AND period_key = ?
          AND status IN ('reserved', 'completed')
      `)
      .get(
        userId,
        feature,
        periodKey
      ) as UsageCount;

    if (result.used >= limit) {
      return {
        allowed: false as const,
        plan,
        used: result.used,
        limit,
        remaining: 0 as const,
        resetsAt: getResetAt(
          premium,
          entitlement,
          now
        ),
      };
    }

    const reservationId = randomUUID();

    db.prepare(`
      INSERT INTO ai_usage (
        id,
        user_id,
        feature,
        period_key,
        status,
        created_at
      )
      VALUES (?, ?, ?, ?, 'reserved', ?)
    `).run(
      reservationId,
      userId,
      feature,
      periodKey,
      now.toISOString()
    );

    return {
      allowed: true as const,
      reservationId,
      plan,
      used: result.used + 1,
      limit,
      remaining: limit - result.used - 1,
      resetsAt: getResetAt(
        premium,
        entitlement,
        now
      ),
    };
  });

  return reserve.immediate();
}

export function completeAiUsage(
  reservationId: string
): void {
  db.prepare(`
    UPDATE ai_usage
    SET status = 'completed',
        completed_at = ?
    WHERE id = ?
      AND status = 'reserved'
  `).run(
    new Date().toISOString(),
    reservationId
  );
}

export function releaseAiUsage(
  reservationId: string
): void {
  db.prepare(`
    DELETE FROM ai_usage
    WHERE id = ?
      AND status = 'reserved'
  `).run(reservationId);
}
