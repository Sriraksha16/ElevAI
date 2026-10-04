import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

type SettingsRow = {
  user_id: string;
  preferred_tone: string;
  resume_format: string;
  email_notifications: number;
  application_reminders: number;
  updated_at: string;
};

const DEFAULT_SETTINGS = {
  preferredTone: "professional" as const,
  resumeFormat: "pdf" as const,
  emailNotifications: true,
  applicationReminders: true,
};

function getSettings(userId: string) {
  const row = db
    .prepare(
      `
      SELECT
        user_id,
        preferred_tone,
        resume_format,
        email_notifications,
        application_reminders,
        updated_at
      FROM user_settings
      WHERE user_id = ?
      LIMIT 1
      `
    )
    .get(userId) as SettingsRow | undefined;

  if (!row) {
    return DEFAULT_SETTINGS;
  }

  return {
    preferredTone:
      row.preferred_tone === "confident" ||
      row.preferred_tone === "friendly"
        ? row.preferred_tone
        : "professional",

    resumeFormat:
      row.resume_format === "docx"
        ? "docx"
        : "pdf",

    emailNotifications:
      Boolean(row.email_notifications),

    applicationReminders:
      Boolean(row.application_reminders),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message:
            "You must be signed in to view your settings.",
        },
        { status: 401 }
      );
    }

    const settings = getSettings(session.user.id);

    return Response.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Settings GET error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load your settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message:
            "You must be signed in to update your settings.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const preferredTone =
      body.preferredTone === "professional" ||
      body.preferredTone === "confident" ||
      body.preferredTone === "friendly"
        ? body.preferredTone
        : null;

    const resumeFormat =
      body.resumeFormat === "pdf" ||
      body.resumeFormat === "docx"
        ? body.resumeFormat
        : null;

    const emailNotifications =
      typeof body.emailNotifications === "boolean"
        ? body.emailNotifications
        : null;

    const applicationReminders =
      typeof body.applicationReminders === "boolean"
        ? body.applicationReminders
        : null;

    if (!preferredTone) {
      return Response.json(
        {
          success: false,
          message: "Invalid writing tone.",
        },
        { status: 400 }
      );
    }

    if (!resumeFormat) {
      return Response.json(
        {
          success: false,
          message: "Invalid resume format.",
        },
        { status: 400 }
      );
    }

    if (emailNotifications === null) {
      return Response.json(
        {
          success: false,
          message:
            "Invalid email notification setting.",
        },
        { status: 400 }
      );
    }

    if (applicationReminders === null) {
      return Response.json(
        {
          success: false,
          message:
            "Invalid application reminder setting.",
        },
        { status: 400 }
      );
    }

    const updatedAt = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO user_settings (
        user_id,
        preferred_tone,
        resume_format,
        email_notifications,
        application_reminders,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)

      ON CONFLICT(user_id)
      DO UPDATE SET
        preferred_tone = excluded.preferred_tone,
        resume_format = excluded.resume_format,
        email_notifications = excluded.email_notifications,
        application_reminders = excluded.application_reminders,
        updated_at = excluded.updated_at
      `
    ).run(
      session.user.id,
      preferredTone,
      resumeFormat,
      emailNotifications ? 1 : 0,
      applicationReminders ? 1 : 0,
      updatedAt
    );

    return Response.json({
      success: true,
      message: "Settings saved successfully.",
      settings: {
        preferredTone,
        resumeFormat,
        emailNotifications,
        applicationReminders,
      },
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to save your settings.",
      },
      { status: 500 }
    );
  }
}