import crypto from "crypto";
import db from "@/lib/db";
import { hashPassword } from "@/lib/auth";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  career_title: string;
  created_at: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const careerTitle =
      typeof body.careerTitle === "string" &&
      body.careerTitle.trim()
        ? body.careerTitle.trim()
        : "Career Explorer";

    if (!name) {
      return Response.json(
        {
          success: false,
          message: "Please enter your name.",
        },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return Response.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const existingUser = db
      .prepare(
        "SELECT id FROM users WHERE email = ?"
      )
      .get(email);

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        career_title,
        created_at
      )
      VALUES (
        @id,
        @name,
        @email,
        @passwordHash,
        @careerTitle,
        @createdAt
      )
    `).run({
      id,
      name,
      email,
      passwordHash,
      careerTitle,
      createdAt,
    });

    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          career_title,
          created_at
        FROM users
        WHERE id = ?
      `)
      .get(id) as Omit<
      UserRecord,
      "password_hash"
    > | undefined;

    return Response.json(
      {
        success: true,
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create your account.",
      },
      { status: 500 }
    );
  }
}