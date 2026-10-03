import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import db from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

import { authOptions } from "../../../../lib/auth-options";

export async function POST(
  request: Request
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter your current password.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const user = db
      .prepare(
        "SELECT password_hash FROM users WHERE id = ?"
      )
      .get(session.user.id) as
      | { password_hash: string }
      | undefined;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Account not found.",
        },
        { status: 404 }
      );
    }

    if (
      !verifyPassword(
        currentPassword,
        user.password_hash
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your current password is incorrect.",
        },
        { status: 400 }
      );
    }

    const newPasswordHash =
      hashPassword(newPassword);

    db.prepare(`
      UPDATE users
      SET
        password_hash = ?,
        reset_token_hash = NULL,
        reset_token_expires_at = NULL
      WHERE id = ?
    `).run(
      newPasswordHash,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message:
        "Your password has been changed.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to change your password.",
      },
      { status: 500 }
    );
  }
}