import { createHash, randomUUID } from "crypto";
import { getServerSession } from "next-auth";

import { generateCareerInsights } from "@/lib/ai/career-advisor";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";
import {
  reserveAiUsage,
  completeAiUsage,
  releaseAiUsage,
} from "@/lib/ai/usage-limits";

const PDF_TYPE = "application/pdf";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type SavedResume = {
  id: string;
  file_name: string;
  file_type: string;
  resume_text: string;
  content_hash: string | null;
};

type SavedCareerInsights = {
  id: string;
  resume_id: string;
  insights_json: string;
  created_at: string;
};

function getSavedResume(
  userId: string,
  contentHash: string
): SavedResume | undefined {
  return db
    .prepare(
      `
      SELECT
        id,
        file_name,
        file_type,
        resume_text,
        content_hash
      FROM resumes
      WHERE user_id = ?
        AND content_hash = ?
      ORDER BY created_at DESC
      LIMIT 1
      `
    )
    .get(userId, contentHash) as
    | SavedResume
    | undefined;
}

function getCachedInsights(
  userId: string,
  resumeId: string
): SavedCareerInsights | undefined {
  return db
    .prepare(
      `
      SELECT
        id,
        resume_id,
        insights_json,
        created_at
      FROM career_insights
      WHERE user_id = ?
        AND resume_id = ?
      LIMIT 1
      `
    )
    .get(userId, resumeId) as
    | SavedCareerInsights
    | undefined;
}

export async function POST(request: Request) {
   let reservationId: string | null = null;
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
          message:
            "You must be signed in to generate career insights.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // FILE UPLOAD
    // -----------------------------------------
    const formData = await request.formData();

    const resume = formData.get("resume");

    if (!(resume instanceof File)) {
      return Response.json(
        {
          success: false,
          message: "No resume file was provided.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // FILE SIZE PROTECTION
    // -----------------------------------------
    if (resume.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message:
            "Resume file is too large. The maximum size is 10 MB.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // EXTRACT RESUME TEXT
    // -----------------------------------------
    const buffer = Buffer.from(
      await resume.arrayBuffer()
    );

    let resumeText = "";

    // -----------------------------------------
    // PDF
    // -----------------------------------------
    if (resume.type === PDF_TYPE) {
      const { PDFParse } = await import("pdf-parse");
      const { getPath } = await import("pdf-parse/worker");

      PDFParse.setWorker(getPath());

      const parser = new PDFParse({
        data: buffer,
      });

      try {
        const result = await parser.getText();

        resumeText = result.text;
      } finally {
        await parser.destroy();
      }
    }

    // -----------------------------------------
    // DOCX
    // -----------------------------------------
    else if (resume.type === DOCX_TYPE) {
      const mammoth = await import("mammoth");

      const result =
        await mammoth.default.extractRawText({
          buffer,
        });

      resumeText = result.value;
    }

    // -----------------------------------------
    // UNSUPPORTED FILE
    // -----------------------------------------
    else {
      return Response.json(
        {
          success: false,
          message:
            "Only PDF and DOCX resumes are supported.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // VALIDATE EXTRACTED TEXT
    // -----------------------------------------
    const normalizedText = resumeText.trim();

    if (!normalizedText) {
      return Response.json(
        {
          success: false,
          message:
            "We could not find readable text in this resume.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // CREATE SAME CONTENT FINGERPRINT
    // -----------------------------------------
    // This is intentionally the same hashing
    // strategy used by Resume Intelligence.
    //
    // Filename does not matter.
    //
    // Resume.pdf
    // Resume_Final.pdf
    // MyResume.pdf
    //
    // can all resolve to the same saved resume
    // when their extracted content is identical.
    const contentHash = createHash("sha256")
      .update(normalizedText, "utf8")
      .digest("hex");

    // -----------------------------------------
    // FIND SAVED RESUME
    // -----------------------------------------
    const savedResume = getSavedResume(
      userId,
      contentHash
    );

    if (!savedResume) {
      return Response.json(
        {
          success: false,
          message:
            "Please analyze this resume first from Resume Intelligence. Career Insights uses your saved resume version.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // CHECK CAREER INSIGHTS CACHE
    // -----------------------------------------
    const cachedInsights = getCachedInsights(
      userId,
      savedResume.id
    );

    if (cachedInsights) {
      try {
        const insights = JSON.parse(
          cachedInsights.insights_json
        );

        return Response.json({
          success: true,
          cached: true,
          message:
            "Career insights for this resume version have already been generated. Your saved insights have been reused.",
          resumeId: savedResume.id,
          insightsId: cachedInsights.id,
          fileName: savedResume.file_name,
          insights,
        });
      } catch {
        // If the stored JSON is invalid, continue
        // and regenerate the insights.
      }
    }
      
    
    // -----------------------------------------
    // CHECK AI USAGE LIMIT
    // -----------------------------------------
    const quota = reserveAiUsage(userId, "careerInsights");

    if (!quota.allowed) {
      return Response.json(
        {
          success: false,
          code: "AI_USAGE_LIMIT_REACHED",
          message:
            "You've reached your Career Insights limit for this period. Please try again after it resets or check your Premium options.",
          usage: {
            plan: quota.plan,
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
            resetsAt: quota.resetsAt,
          },
        },
        { status: 429 }
      );
    }

    reservationId = quota.reservationId;

    // -----------------------------------------
    // GENERATE NEW CAREER INSIGHTS
    // -----------------------------------------
    const insights =
      await generateCareerInsights(normalizedText);

    // -----------------------------------------
    // CHECK AGAIN AFTER AI ANALYSIS
    // -----------------------------------------
    // This protects against two requests analyzing
    // the same resume at the same time.
    const cachedAfterAnalysis =
      getCachedInsights(
        userId,
        savedResume.id
      );

    if (cachedAfterAnalysis) {
      try {
        const existingInsights = JSON.parse(
          cachedAfterAnalysis.insights_json
        );

         if (reservationId) {
  releaseAiUsage(reservationId);
  reservationId = null;
}

        return Response.json({
          success: true,
          cached: true,
          message:
            "Career insights for this resume version have already been generated. Your saved insights have been reused.",
          resumeId: savedResume.id,
          insightsId: cachedAfterAnalysis.id,
          fileName: savedResume.file_name,
          insights: existingInsights,
        });
      } catch {
        // Continue with saving the newly generated
        // valid result.
      }
    }

    // -----------------------------------------
    // SAVE CAREER INSIGHTS
    // -----------------------------------------
    const insightsId = randomUUID();

    const createdAt = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO career_insights (
        id,
        resume_id,
        user_id,
        insights_json,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
      `
    ).run(
      insightsId,
      savedResume.id,
      userId,
      JSON.stringify(insights),
      createdAt
    );

    if (reservationId) {
  completeAiUsage(reservationId);
  reservationId = null;
}

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------
    return Response.json({
      success: true,
      cached: false,
      message:
        "New career insights generated and saved successfully.",
      resumeId: savedResume.id,
      insightsId,
      fileName: savedResume.file_name,
      insights,
    });
  } catch (error) {
    if (reservationId) {
  releaseAiUsage(reservationId);
  reservationId = null;
}
    console.error(
      "Career insights error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while generating career insights.",
      },
      { status: 500 }
    );
  }
}