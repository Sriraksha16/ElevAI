import { getPath } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";


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

     if (file.type === "application/pdf") {
           const parser = new PDFParse({
             data: buffer,
            });
 
            const result = await parser.getText();

             extractedText = result.text;

               await parser.destroy();
        }
     else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      extractedText = result.value;
    } else {
      return Response.json(
        {
          success: false,
          message: "Only PDF and DOCX files are supported.",
        },
        { status: 400 }
      );
    }

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

    return Response.json({
      success: true,
      message: "Resume text extracted successfully.",
      fileName: file.name,
      fileType: file.type,
      characterCount: extractedText.length,
      text: extractedText,
    });
  } 
  
   catch (error) {
  console.error("Resume extraction error:", error);

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