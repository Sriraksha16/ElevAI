import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  career_title: string;
  created_at: string;
};

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);

  return session?.user?.id ?? null;
}

/**
 * GET /api/account/profile
 *
 * Returns the profile belonging to the currently signed-in user.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const user = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          career_title,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `
      )
      .get(userId) as UserRecord | undefined;

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Your account could not be found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        careerTitle: user.career_title,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Profile GET error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load your profile.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/account/profile
 *
 * Updates only the currently signed-in user's profile.
 */
export async function PATCH(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const careerTitle =
      typeof body.careerTitle === "string"
        ? body.careerTitle.trim()
        : "";

    if (!name) {
      return Response.json(
        {
          success: false,
          message: "Name cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (!careerTitle) {
      return Response.json(
        {
          success: false,
          message: "Career title cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (name.length > 120) {
      return Response.json(
        {
          success: false,
          message: "Name is too long.",
        },
        { status: 400 }
      );
    }

    if (careerTitle.length > 120) {
      return Response.json(
        {
          success: false,
          message: "Career title is too long.",
        },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        `
        UPDATE users
        SET
          name = ?,
          career_title = ?
        WHERE id = ?
        `
      )
      .run(name, careerTitle, userId);

    if (result.changes === 0) {
      return Response.json(
        {
          success: false,
          message: "Your account could not be updated.",
        },
        { status: 404 }
      );
    }

    const updatedUser = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          career_title,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `
      )
      .get(userId) as UserRecord | undefined;

    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          message: "Your updated account could not be loaded.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        careerTitle: updatedUser.career_title,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to update your profile.",
      },
      { status: 500 }
    );
  }
}