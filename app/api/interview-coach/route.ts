
import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import mammoth from "mammoth";

import {
  generateInterviewPreparation,
} from "@/lib/ai/interview-coach";

import {
  reserveAiUsage,
  completeAiUsage,
  releaseAiUsage,
} from "@/lib/ai/usage-limits";

PDFParse.setWorker(getPath());

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
          message: "Please sign in to use this AI feature.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // READ FORM DATA
    // -----------------------------------------
    const formData = await request.formData();

    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    // -----------------------------------------
    // VALIDATE RESUME
    // -----------------------------------------
    if (!(resume instanceof File)) {
      return Response.json(
        {
          success: false,
          message: "Please upload your resume.",
        },
        { status: 400 }
      );
    }

    if (resume.size === 0) {
      return Response.json(
        {
          success: false,
          message: "The uploaded resume is empty.",
        },
        { status: 400 }
      );
    }

    if (resume.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: "Resume must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // VALIDATE JOB DESCRIPTION
    // -----------------------------------------
    if (
      typeof jobDescription !== "string" ||
      !jobDescription.trim()
    ) {
      return Response.json(
        {
          success: false,
          message: "Please provide a job description.",
        },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 50) {
      return Response.json(
        {
          success: false,
          message:
            "Please provide a more complete job description.",
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

    if (resume.type === "application/pdf") {
      const parser = new PDFParse({
        data: buffer,
      });

      try {
        const result = await parser.getText();
        resumeText = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (
      resume.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      resumeText = result.value;
    } else {
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
    const normalizedResumeText = resumeText.trim();

    if (!normalizedResumeText) {
      return Response.json(
        {
          success: false,
          message:
            "The resume could not be read. Please upload a readable PDF or DOCX file.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // CHECK AI USAGE LIMIT
    // -----------------------------------------
    const quota = reserveAiUsage(
      userId,
      "interviewPreparation"
    );

    if (!quota.allowed) {
      return Response.json(
        {
          success: false,
          code: "AI_USAGE_LIMIT_REACHED",
          message:
            "You've reached your Interview Coach limit for this period. Please try again after it resets or check your Premium options.",
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
    // GENERATE INTERVIEW PREPARATION
    // -----------------------------------------
    const result = await generateInterviewPreparation(
      normalizedResumeText,
      jobDescription.trim()
    );

    // -----------------------------------------
    // COMPLETE USAGE
    // -----------------------------------------
    if (reservationId) {
      completeAiUsage(reservationId);
      reservationId = null;
    }

    // -----------------------------------------
    // RETURN RESULT
    // -----------------------------------------
    return Response.json({
      success: true,
      message:
        "Interview preparation generated successfully.",
      fileName: resume.name,
      result,
    });
  } catch (error) {
    // Release usage if generation fails before completion.
    if (reservationId) {
      releaseAiUsage(reservationId);
      reservationId = null;
    }

    // Avoid logging resume text or other personal data.
    console.error("Interview coach generation failed.");

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while preparing the interview.";

    const status = message.includes("AI is not configured")
      ? 503
      : 500;

    return Response.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
