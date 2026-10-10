
import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { generateCoverLetter } from "@/lib/ai/cover-letter-generator";
import {
  reserveAiUsage,
  completeAiUsage,
  releaseAiUsage,
} from "@/lib/ai/usage-limits";

PDFParse.setWorker(getPath());

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TONES = [
  "professional",
  "confident",
  "friendly",
] as const;

type Tone = (typeof ALLOWED_TONES)[number];

function isTone(
  value: FormDataEntryValue | null
): value is Tone {
  return (
    typeof value === "string" &&
    ALLOWED_TONES.includes(value as Tone)
  );
}

function looksLikeSecurityVerificationPage(
  text: string
): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return false;
  }

  const securityIndicators = [
    "checking your browser",
    "checking your browser before accessing",
    "verify you are human",
    "verify youâ€™re human",
    "verification required",
    "security verification",
    "security check",
    "browser verification",
    "enable javascript",
    "enable cookies",
    "just a moment",
    "cloudflare",
    "cf-chl",
    "ray id",
    "ddos protection",
    "access denied",
    "please wait while we verify",
    "checking if the site connection is secure",
  ];

  const matchedIndicators =
    securityIndicators.filter((indicator) =>
      normalized.includes(indicator)
    );

  if (matchedIndicators.length >= 2) {
    return true;
  }

  const strongSecurityIndicators = [
    "checking your browser",
    "verify you are human",
    "verification required",
    "cloudflare",
    "just a moment",
    "cf-chl",
    "ray id",
  ];

  return strongSecurityIndicators.some((indicator) =>
    normalized.includes(indicator)
  );
}

function looksLikeResume(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || normalized.length < 150) {
    return false;
  }

  const resumeIndicators = [
    "experience",
    "education",
    "skills",
    "projects",
    "certification",
    "certifications",
    "professional summary",
    "summary",
    "employment",
    "work history",
    "technical skills",
    "achievements",
    "languages",
    "linkedin",
    "github",
  ];

  const matches = resumeIndicators.filter((indicator) =>
    normalized.includes(indicator)
  );

  return matches.length >= 2;
}

export async function POST(request: Request) {
  let reservationId: string | null = null;

  try {
    // ----------------------------------------
    // AUTHENTICATION
    // ----------------------------------------
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

    const formData = await request.formData();

    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");
    const tone = formData.get("tone");

    // ----------------------------------------
    // VALIDATE RESUME
    // ----------------------------------------
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

    // ----------------------------------------
    // VALIDATE JOB DESCRIPTION
    // ----------------------------------------
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

    // ----------------------------------------
    // VALIDATE TONE
    // ----------------------------------------
    const selectedTone: Tone = isTone(tone)
      ? tone
      : "professional";

    // ----------------------------------------
    // EXTRACT RESUME TEXT
    // ----------------------------------------
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

    // ----------------------------------------
    // CLEAN EXTRACTED TEXT
    // ----------------------------------------
    resumeText = resumeText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!resumeText) {
      return Response.json(
        {
          success: false,
          message:
            "The resume could not be read. Please upload a readable PDF or DOCX file.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // DETECT SECURITY VERIFICATION PAGES
    // ----------------------------------------
    if (looksLikeSecurityVerificationPage(resumeText)) {
      return Response.json(
        {
          success: false,
          message:
            "This PDF appears to contain a website security-verification page instead of your actual resume. Please download the original resume PDF from its source and upload that file directly.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // VALIDATE RESUME CONTENT
    // ----------------------------------------
    if (!looksLikeResume(resumeText)) {
      return Response.json(
        {
          success: false,
          message:
            "We could not identify enough resume information in this file. Please upload your actual resume as a PDF or DOCX containing your experience, skills, education, or projects.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // CHECK AI USAGE LIMIT
    // ----------------------------------------
    const quota = reserveAiUsage(userId, "coverLetter");

    if (!quota.allowed) {
      return Response.json(
        {
          success: false,
          code: "AI_USAGE_LIMIT_REACHED",
          message:
            "You've reached your Cover Letter limit for this period. Please try again after it resets or check your Premium options.",
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

    // ----------------------------------------
    // GENERATE COVER LETTER
    // ----------------------------------------
    const result = await generateCoverLetter(
      resumeText,
      jobDescription.trim(),
      selectedTone
    );

    // ----------------------------------------
    // COMPLETE USAGE
    // ----------------------------------------
    // Count the use after successful generation.
    if (reservationId) {
      completeAiUsage(reservationId);
      reservationId = null;
    }

    // ----------------------------------------
    // RETURN RESULT
    // ----------------------------------------
    return Response.json({
      success: true,
      message: "Cover letter generated successfully.",
      fileName: resume.name,
      tone: selectedTone,
      result,
    });
  } catch (error) {
    if (reservationId) {
      releaseAiUsage(reservationId);
      reservationId = null;
    }

    // Do not log uploaded resume contents or other
    // personal information.
    console.error("Cover letter generation failed.");

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while generating the cover letter.";

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
