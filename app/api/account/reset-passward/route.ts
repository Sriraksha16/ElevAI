import { NextResponse } from "next/server";

import db from "@/lib/db";

import {
  hashPassword,
  hashResetToken,
} from "@/lib/auth";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid password reset link.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const tokenHash =
      hashResetToken(token);

    const user = db
      .prepare(`
        SELECT
          id,
          reset_token_expires_at
        FROM users
        WHERE reset_token_hash = ?
      `)
      .get(tokenHash) as
      | {
          id: string;
          reset_token_expires_at:
            | string
            | null;
        }
      | undefined;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password reset link is invalid or has already been used.",
        },
        { status: 400 }
      );
    }

    if (
      !user.reset_token_expires_at ||
      new Date(
        user.reset_token_expires_at
      ).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password reset link has expired.",
        },
        { status: 400 }
      );
    }

    const passwordHash =
      hashPassword(password);

    db.prepare(`
      UPDATE users
      SET
        password_hash = ?,
        reset_token_hash = NULL,
        reset_token_expires_at = NULL
      WHERE id = ?
    `).run(
      passwordHash,
      user.id
    );

    return NextResponse.json({
      success: true,
      message:
        "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset your password.",
      },
      { status: 500 }
    );
  }
}