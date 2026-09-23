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

function isTone(value: FormDataEntryValue | null): value is Tone {
  return (
    typeof value === "string" &&
    ALLOWED_TONES.includes(value as Tone)
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");
    const tone = formData.get("tone");

    // -----------------------------
    // Validate resume
    // -----------------------------

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

    // -----------------------------
    // Validate job description
    // -----------------------------

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

    // -----------------------------
    // Validate tone
    // -----------------------------

    const selectedTone: Tone = isTone(tone)
      ? tone
      : "professional";

    // -----------------------------
    // Extract resume text
    // -----------------------------

    const buffer = Buffer.from(await resume.arrayBuffer());

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

    // -----------------------------
    // Validate extracted text
    // -----------------------------

    if (!resumeText.trim()) {
      return Response.json(
        {
          success: false,
          message:
            "The resume could not be read. Please upload a readable PDF or DOCX file.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // Generate cover letter
    // -----------------------------

    const result = await generateCoverLetter(
      resumeText,
      jobDescription,
      selectedTone
    );

    return Response.json({
      success: true,
      message: "Cover letter generated successfully.",
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