import { createHash, randomUUID } from "crypto";
import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";

import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { calculateResumeScores } from "@/lib/scoring/resume-score";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

PDFParse.setWorker(getPath());

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const PDF_TYPE = "application/pdf";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ExistingResume = {
  resume_id: string;
  file_name: string;
  file_type: string;
  created_at: string;
  analysis_id: string | null;
  analysis_json: string | null;
  scores_json: string | null;
};

function getCachedResume(
  userId: string,
  contentHash: string
): ExistingResume | undefined {
  return db
    .prepare(
      `
      SELECT
        r.id AS resume_id,
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
        AND r.content_hash = ?
      ORDER BY r.created_at DESC
      LIMIT 1
      `
    )
    .get(userId, contentHash) as ExistingResume | undefined;
}

function returnCachedResume(
  resume: ExistingResume,
  characterCount: number
) {
  if (
    !resume.analysis_id ||
    !resume.analysis_json ||
    !resume.scores_json
  ) {
    return null;
  }

  try {
    const analysis = JSON.parse(resume.analysis_json);
    const scores = JSON.parse(resume.scores_json);

    return Response.json({
      success: true,
      cached: true,
      message:
        "This resume version has already been analyzed. Your saved analysis has been reused.",
      resumeId: resume.resume_id,
      analysisId: resume.analysis_id,
      fileName: resume.file_name,
      characterCount,
      analysis,
      scores,
    });
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
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
          message: "You must be signed in to analyze a resume.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // FILE UPLOAD
    // -----------------------------------------
    const formData = await request.formData();

    const file = formData.get("resume");

    if (!(file instanceof File)) {
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
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: "Resume file is too large. The maximum size is 10 MB.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // FILE CONTENT
    // -----------------------------------------
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = "";

    // -----------------------------------------
    // PDF
    // -----------------------------------------
    if (file.type === PDF_TYPE) {
      const parser = new PDFParse({
        data: buffer,
      });

      try {
        const result = await parser.getText();

        extractedText = result.text;
      } finally {
        await parser.destroy();
      }
    }

    // -----------------------------------------
    // DOCX
    // -----------------------------------------
    else if (file.type === DOCX_TYPE) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      extractedText = result.value;
    }

    // -----------------------------------------
    // UNSUPPORTED FILE
    // -----------------------------------------
    else {
      return Response.json(
        {
          success: false,
          message: "Only PDF and DOCX files are supported.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // MAKE SURE TEXT WAS EXTRACTED
    // -----------------------------------------
    const normalizedText = extractedText.trim();

    if (!normalizedText) {
      return Response.json(
        {
          success: false,
          message: "We could not find readable text in this resume.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // CREATE CONTENT FINGERPRINT
    // -----------------------------------------
    // The hash is based on the actual extracted
    // resume content, NOT the filename.
    //
    // Therefore the same resume uploaded as:
    //
    // Resume.pdf
    // Resume_Final.pdf
    // MyResume.pdf
    //
    // can reuse the same AI analysis.
    const contentHash = createHash("sha256")
      .update(normalizedText, "utf8")
      .digest("hex");

    // -----------------------------------------
    // CHECK USER'S EXISTING RESUME VERSION
    // -----------------------------------------
    const existingResume = getCachedResume(
      userId,
      contentHash
    );

    const cachedResponse = existingResume
      ? returnCachedResume(
          existingResume,
          normalizedText.length
        )
      : null;

    if (cachedResponse) {
      return cachedResponse;
    }

    // -----------------------------------------
    // NEW RESUME VERSION
    // -----------------------------------------
    const analysis = await analyzeResume(normalizedText);

    // -----------------------------------------
    // ELEVAI SCORING ENGINE
    // -----------------------------------------
    const scores = calculateResumeScores(analysis);

    // -----------------------------------------
    // CHECK AGAIN
    // -----------------------------------------
    // Another request could have saved this exact
    // version while the AI analysis was running.
    //
    // If it already exists now, reuse the saved
    // result instead of creating a duplicate record.
    const existingAfterAnalysis = getCachedResume(
      userId,
      contentHash
    );

    const cachedAfterAnalysis = existingAfterAnalysis
      ? returnCachedResume(
          existingAfterAnalysis,
          normalizedText.length
        )
      : null;

    if (cachedAfterAnalysis) {
      return cachedAfterAnalysis;
    }

    // -----------------------------------------
    // CREATE DATABASE RECORDS
    // -----------------------------------------
    const resumeId = randomUUID();

    const analysisId = randomUUID();

    const createdAt = new Date().toISOString();

    // -----------------------------------------
    // SAVE RESUME + ANALYSIS ATOMICALLY
    // -----------------------------------------
    // Both records are saved together.
    //
    // If either insert fails, the transaction
    // rolls back instead of leaving incomplete
    // resume data.
    const saveResume = db.transaction(() => {
      db.prepare(
        `
        INSERT INTO resumes (
          id,
          user_id,
          file_name,
          file_type,
          resume_text,
          content_hash,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      ).run(
        resumeId,
        userId,
        file.name,
        file.type,
        normalizedText,
        contentHash,
        createdAt
      );

      db.prepare(
        `
        INSERT INTO resume_analyses (
          id,
          resume_id,
          user_id,
          analysis_json,
          scores_json,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `
      ).run(
        analysisId,
        resumeId,
        userId,
        JSON.stringify(analysis),
        JSON.stringify(scores),
        createdAt
      );
    });

    saveResume();

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------
    return Response.json({
      success: true,
      cached: false,
      message:
        "New resume version analyzed and saved successfully.",
      resumeId,
      analysisId,
      fileName: file.name,
      characterCount: normalizedText.length,
      analysis,
      scores,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while processing the resume.",
      },
      { status: 500 }
    );
  }
}