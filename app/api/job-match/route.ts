import { matchResumeToJob } from "@/lib/ai/job-matcher";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    // -----------------------------------------
    // Validate resume
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
    // Validate job description
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
    // Validate file size
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
    // Read file
    // -----------------------------------------

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
    // AI JOB MATCHING
    // -----------------------------------------

    const match = await matchResumeToJob(
      resumeText,
      jobDescription
    );

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