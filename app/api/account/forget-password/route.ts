import {
  createResetToken,
  hashResetToken,
} from "@/lib/auth";

import db from "@/lib/db";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (
      !email ||
      !email.includes("@")
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const user = db
      .prepare(
        "SELECT id FROM users WHERE email = ?"
      )
      .get(email) as
      | { id: string }
      | undefined;

    /*
     * Do not reveal whether an email exists.
     */
    if (!user) {
      return Response.json({
        success: true,
        message:
          "If an account exists for this email, a password reset link will be sent.",
      });
    }

    const token = createResetToken();

    const tokenHash =
      hashResetToken(token);

    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    ).toISOString();

    db.prepare(`
      UPDATE users
      SET
        reset_token_hash = ?,
        reset_token_expires_at = ?
      WHERE id = ?
    `).run(
      tokenHash,
      expiresAt,
      user.id
    );

    /*
     * Email delivery will be connected once
     * an email provider credential is added.
     */
    const appUrl =
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${appUrl}/reset-password?token=${token}`;

    if (!process.env.RESEND_API_KEY) {
      console.log(
        "Password reset link:",
        resetUrl
      );

      return Response.json(
        {
          success: false,
          message:
            "Password reset email is not configured yet. The reset system is ready, but an email provider must be connected.",
        },
        { status: 503 }
      );
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.RESEND_FROM_EMAIL ||
            "ElevAI <onboarding@resend.dev>",
          to: [email],
          subject:
            "Reset your ElevAI password",
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h2>Reset your ElevAI password</h2>
              <p>
                We received a request to reset your
                ElevAI password.
              </p>
              <p>
                <a href="${resetUrl}">
                  Reset your password
                </a>
              </p>
              <p>
                This link expires in 30 minutes.
              </p>
              <p>
                If you did not request this,
                you can ignore this email.
              </p>
            </div>
          `,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Email provider error:",
        await response.text()
      );

      return Response.json(
        {
          success: false,
          message:
            "Unable to send the password reset email.",
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      message:
        "If an account exists for this email, a password reset link will be sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Unable to process the password reset request.",
      },
      { status: 500 }
    );
  }
}