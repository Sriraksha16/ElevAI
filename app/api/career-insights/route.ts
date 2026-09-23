import { generateCareerInsights } from "@/lib/ai/career-advisor";

export async function POST(request: Request) {
  try {
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

    const buffer = Buffer.from(
      await resume.arrayBuffer()
    );

    let resumeText = "";

    // -----------------------------------------
    // PDF
    // -----------------------------------------
    if (resume.type === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const { getPath } = await import("pdf-parse/worker");

      PDFParse.setWorker(getPath());

      const parser = new PDFParse({
        data: buffer,
      });

      const result = await parser.getText();

      resumeText = result.text;

      await parser.destroy();
    }

    // -----------------------------------------
    // DOCX
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
    // Unsupported file
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
    // Validate extracted text
    // -----------------------------------------
    if (!resumeText.trim()) {
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
    // AI CAREER INSIGHTS
    // -----------------------------------------
    const insights =
      await generateCareerInsights(resumeText);

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------
    return Response.json({
      success: true,
      message:
        "Career insights generated successfully.",
      fileName: resume.name,
      insights,
    });
  } catch (error) {
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