import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import db from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE(
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

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter your password to delete your account.",
        },
        { status: 400 }
      );
    }

    const user = db
      .prepare(`
        SELECT password_hash
        FROM users
        WHERE id = ?
      `)
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
        password,
        user.password_hash
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Incorrect password.",
        },
        { status: 400 }
      );
    }

    db.prepare(
      "DELETE FROM users WHERE id = ?"
    ).run(session.user.id);

    return NextResponse.json({
      success: true,
      message: "Your account has been deleted.",
    });
  } catch (error) {
    console.error(
      "Delete account error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete your account.",
      },
      { status: 500 }
    );
  }
}