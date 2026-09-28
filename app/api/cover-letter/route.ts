import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

import { generateCoverLetter } from "@/lib/ai/cover-letter-generator";

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

/**
 * Detect PDFs that contain a website/security
 * verification page instead of the actual resume.
 */
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
    "verify you’re human",
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

  /*
   * A single generic phrase should not automatically
   * reject a legitimate resume. Require stronger evidence
   * when possible.
   */
  if (matchedIndicators.length >= 2) {
    return true;
  }

  /*
   * These phrases are highly characteristic of
   * verification/interstitial pages.
   */
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

/**
 * Check whether the extracted document contains
 * enough resume-like information to send to the AI.
 */
function looksLikeResume(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return false;
  }

  /*
   * Very small extracted documents are usually not
   * complete resumes.
   */
  if (normalized.length < 150) {
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

  /*
   * A legitimate resume will normally contain several
   * recognizable resume sections.
   */
  return matches.length >= 2;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const resume = formData.get("resume");
    const jobDescription =
      formData.get("jobDescription");
    const tone = formData.get("tone");

    // ----------------------------------------
    // Validate resume
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
          message:
            "The uploaded resume is empty.",
        },
        { status: 400 }
      );
    }

    if (resume.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message:
            "Resume must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Validate job description
    // ----------------------------------------

    if (
      typeof jobDescription !== "string" ||
      !jobDescription.trim()
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Please provide a job description.",
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
    // Validate tone
    // ----------------------------------------

    const selectedTone: Tone = isTone(tone)
      ? tone
      : "professional";

    // ----------------------------------------
    // Extract resume text
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
      const result =
        await mammoth.extractRawText({
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
    // Clean extracted text
    // ----------------------------------------

    resumeText = resumeText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ----------------------------------------
    // Validate extracted text
    // ----------------------------------------

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
    // Detect security/verification pages
    // ----------------------------------------

    if (
      looksLikeSecurityVerificationPage(
        resumeText
      )
    ) {
      return Response.json(
        {
          success: false,
          message:
            "This PDF appears to contain a website security-verification page instead of your actual resume. Please download the original resume PDF from your resume source and upload that file directly.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Validate that document looks like a resume
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
    // Generate cover letter
    // ----------------------------------------

    const result = await generateCoverLetter(
      resumeText,
      jobDescription,
      selectedTone
    );

    // ----------------------------------------
    // Return result
    // ----------------------------------------

    return Response.json({
      success: true,
      message:
        "Cover letter generated successfully.",
      fileName: resume.name,
      tone: selectedTone,
      result,
    });
  } catch (error) {
    console.error(
      "Cover letter generation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while generating the cover letter.";

    const status =
      message.includes("AI is not configured")
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