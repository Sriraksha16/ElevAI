import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

type ResumeRow = {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  analysis_id: string | null;
  analysis_json: string | null;
  scores_json: string | null;
};

function safeParseJson(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // -----------------------------------------
    // AUTHENTICATION
    // -----------------------------------------
    const session = await getServerSession(authOptions);

    const userId = session?.user?.id;

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: "You must be signed in to view your resume history.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // LOAD ONLY THIS USER'S RESUMES
    // -----------------------------------------
    const rows = db
      .prepare(
        `
        SELECT
          r.id,
          r.file_name,
          r.file_type,
          r.created_at,
          a.id AS analysis_id,
          a.analysis_json,
          a.scores_json
        FROM resumes r
        LEFT JOIN resume_analyses a
          ON a.resume_id = r.id
          AND a.user_id = r.user_id
        WHERE r.user_id = ?
        ORDER BY r.created_at ASC
        `
      )
      .all(userId) as ResumeRow[];

    // -----------------------------------------
    // BUILD VERSION HISTORY
    // -----------------------------------------
    const versions = rows.map((row, index) => ({
      version: index + 1,

      resumeId: row.id,

      analysisId: row.analysis_id,

      fileName: row.file_name,

      fileType: row.file_type,

      createdAt: row.created_at,

      analysis: safeParseJson(row.analysis_json),

      scores: safeParseJson(row.scores_json),
    }));

    return Response.json({
      success: true,
      versions,
    });
  } catch (error) {
    console.error("Resume history error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load resume history.",
      },
      { status: 500 }
    );
  }
}