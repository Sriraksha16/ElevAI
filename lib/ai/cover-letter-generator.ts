import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

export const CoverLetterSchema = z.object({
  candidateProfile: z.object({
    candidateName: z.string(),
    currentPositioning: z.string(),
    relevantSkills: z.array(z.string()),
    relevantExperience: z.array(z.string()),
  }),

  jobProfile: z.object({
    jobTitle: z.string(),
    company: z.string(),
    keyRequirements: z.array(z.string()),
  }),

  coverLetter: z.object({
    subject: z.string(),
    greeting: z.string(),
    opening: z.string(),
    body: z.array(z.string()),
    closing: z.string(),
    fullText: z.string(),
  }),

  personalization: z.object({
    matchedRequirements: z.array(z.string()),
    personalizationPoints: z.array(z.string()),
  }),
});

export type CoverLetterResult = z.infer<typeof CoverLetterSchema>;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "AI is not configured yet. Please add OPENAI_API_KEY to your environment variables."
    );
  }

  return new OpenAI({
    apiKey,
  });
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  tone: "professional" | "confident" | "friendly"
): Promise<CoverLetterResult> {
  if (!resumeText.trim()) {
    throw new Error("Resume text is empty.");
  }

  if (!jobDescription.trim()) {
    throw new Error("Job description is empty.");
  }

  const openai = getOpenAIClient();

  const response = await openai.responses.parse({
    model: "gpt-5.6",

    input: [
      {
        role: "system",
        content: `
You are ElevAI's professional cover letter generator.

Your task is to create a tailored cover letter using ONLY:
1. The candidate's resume.
2. The provided job description.
3. The selected writing tone.

IMPORTANT RULES:

- Never invent employment history.
- Never invent skills.
- Never invent projects.
- Never invent certifications.
- Never invent education.
- Never invent achievements.
- Never invent company information.
- Never claim the candidate has experience that is not supported by the resume.
- Never exaggerate qualifications.
- Never guarantee that the candidate will get the job.
- Do not create unsupported claims just to make the letter sound stronger.
- Use the candidate's actual experience and skills.
- Connect relevant resume evidence to the job requirements.
- Clearly distinguish between skills the candidate actually has and skills merely mentioned in the job description.
- If a requirement is not supported by the resume, do not claim the candidate has it.
- Avoid generic filler.
- Avoid excessive buzzwords.
- Avoid copying the resume word-for-word.
- Make the letter sound natural and human.
- Keep the final cover letter approximately 250-400 words.
- The company name should only be used if it is explicitly present in the job description.
- If the company name is not available, use a neutral greeting rather than inventing a company name.

Selected tone:
${tone}

Return a complete structured result.
        `,
      },
      {
        role: "user",
        content: `
Create a tailored cover letter based on the following information.

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

SELECTED TONE:
${tone}

First identify the candidate's relevant positioning, skills and experience.

Then identify the important job requirements that genuinely match the candidate's resume.

Finally create the cover letter.

The fullText field must contain the complete final cover letter in the correct reading order.

Do not include analysis or explanations inside fullText.
        `,
      },
    ],

    text: {
      format: zodTextFormat(
        CoverLetterSchema,
        "cover_letter_result"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "The AI did not return a valid cover letter."
    );
  }

  return response.output_parsed;
}