
import { matchResumeToJob } from "@/lib/ai/job-matcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  reserveAiUsage,
  completeAiUsage,
  releaseAiUsage,
} from "@/lib/ai/usage-limits";

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
    // FILE UPLOAD
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
          message: "No resume file was provided.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // VALIDATE JOB DESCRIPTION
    // -----------------------------------------
    if (typeof jobDescription !== "string") {
      return Response.json(
        {
          success: false,
          message: "No job description was provided.",
        },
        { status: 400 }
      );
    }

    if (!jobDescription.trim()) {
      return Response.json(
        {
          success: false,
          message: "Job description cannot be empty.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // VALIDATE FILE SIZE
    // -----------------------------------------
    if (resume.size === 0) {
      return Response.json(
        {
          success: false,
          message: "The uploaded resume is empty.",
        },
        { status: 400 }
      );
    }

    if (resume.size > 5 * 1024 * 1024) {
      return Response.json(
        {
          success: false,
          message: "Resume must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // READ FILE
    // -----------------------------------------
    const buffer = Buffer.from(
      await resume.arrayBuffer()
    );

    let resumeText = "";

    // -----------------------------------------
    // EXTRACT PDF TEXT
    // -----------------------------------------
    if (resume.type === "application/pdf") {
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
    // EXTRACT DOCX TEXT
    // -----------------------------------------
    else if (
      resume.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
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
    const normalizedResumeText = resumeText.trim();

    if (!normalizedResumeText) {
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
    // CHECK AI USAGE LIMIT
    // -----------------------------------------
    const quota = reserveAiUsage(userId, "jobMatch");

    if (!quota.allowed) {
      return Response.json(
        {
          success: false,
          code: "AI_USAGE_LIMIT_REACHED",
          message:
            "You've reached your Job Match limit for this period. Please try again after it resets or check your Premium options.",
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
    // AI JOB MATCHING
    // -----------------------------------------
    const match = await matchResumeToJob(
      normalizedResumeText,
      jobDescription.trim()
    );

    // -----------------------------------------
    // COMPLETE USAGE
    // -----------------------------------------
    // Count the use only after the AI call succeeds.
    if (reservationId) {
      completeAiUsage(reservationId);
      reservationId = null;
    }

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------
    return Response.json({
      success: true,
      message:
        "Job match analysis completed successfully.",
      fileName: resume.name,
      match,
    });
  } catch (error) {
    // Release the reservation if the request fails
    // before usage has been completed.
    if (reservationId) {
      releaseAiUsage(reservationId);
      reservationId = null;
    }

    console.error(
      "Job match analysis error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while analyzing the job match.",
      },
      { status: 500 }
    );
  }
}
