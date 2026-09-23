import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { calculateResumeScores } from "@/lib/scoring/resume-score";

PDFParse.setWorker(getPath());

export async function POST(request: Request) {
  try {
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

    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = "";

    // -----------------------------------------
    // PDF
    // -----------------------------------------
    if (file.type === "application/pdf") {
      const parser = new PDFParse({
        data: buffer,
      });

      const result = await parser.getText();

      extractedText = result.text;

      await parser.destroy();
    }

    // -----------------------------------------
    // DOCX
    // -----------------------------------------
    else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      extractedText = result.value;
    }

    // -----------------------------------------
    // Unsupported file
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
    // Make sure text was extracted
    // -----------------------------------------
    if (!extractedText.trim()) {
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
    // REAL AI ANALYSIS
    // -----------------------------------------
    const analysis = await analyzeResume(extractedText);

    // -----------------------------------------
    // ELEVAI SCORING ENGINE
    // -----------------------------------------
    const scores = calculateResumeScores(analysis);

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------
    return Response.json({
      success: true,
      message: "Resume analyzed successfully.",
      fileName: file.name,
      characterCount: extractedText.length,

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