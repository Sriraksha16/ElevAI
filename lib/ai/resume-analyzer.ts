import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const ResumeAnalysisSchema = z.object({
  candidateProfile: z.object({
    professionalSummary: z.string(),
    experienceLevel: z.string(),
    targetRoles: z.array(z.string()),
  }),

  skills: z.object({
    technical: z.array(z.string()),
    soft: z.array(z.string()),
    toolsAndTechnologies: z.array(z.string()),
  }),

  experience: z.object({
    roles: z.array(
      z.object({
        title: z.string(),
        company: z.string(),
        responsibilities: z.array(z.string()),
        achievements: z.array(z.string()),
      })
    ),
  }),

  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      field: z.string(),
      year: z.string(),
    })
  ),

  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
      year: z.string(),
    })
  ),

  ats: z.object({
    score: z.number().min(0).max(100),

    strengths: z.array(z.string()),

    weaknesses: z.array(z.string()),

    missingKeywords: z.array(z.string()),
  }),

  career: z.object({
    skillGaps: z.array(z.string()),

    recommendations: z.array(z.string()),

    suggestedImprovements: z.array(z.string()),
  }),
});

export type ResumeAnalysis = z.infer<
  typeof ResumeAnalysisSchema
>;

export async function analyzeResume(
  resumeText: string
): Promise<ResumeAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!resumeText.trim()) {
    throw new Error("Resume text is empty.");
  }

  const response = await openai.responses.parse({
    model: "gpt-5.6",

    input: [
      {
        role: "system",

        content: `
You are ElevAI, a professional resume intelligence engine.

Your job is to analyze a candidate's resume accurately and produce structured information that will be used by a career application.

IMPORTANT RULES:

1. Use ONLY information supported by the resume.

2. Never invent employment history, education, skills,
   achievements, certifications, companies, technologies,
   job titles, or other candidate information.

3. If information is not present in the resume,
   use an empty array or an appropriate value indicating
   that the information is unavailable.

4. Distinguish between:
   - skills explicitly mentioned in the resume
   - skills inferred from clearly described experience
   - potential skill gaps

5. Do not claim that a candidate has a skill merely because
   it is common for their job title.

6. ATS score must reflect the actual resume content and
   ATS-readiness, including:
   - clarity of sections
   - relevant skills
   - keyword clarity
   - measurable achievements
   - experience clarity
   - professional summary
   - education and certifications when relevant
   - readability of the extracted resume text

7. Do not judge the candidate personally.

8. Recommendations must be actionable and based on
   weaknesses actually identified in the resume.

9. Missing keywords should represent potentially useful
   keywords based on the candidate's apparent target roles.

10. Do not claim that a missing keyword is objectively
    required unless the resume or a supplied job description
    establishes that requirement.

11. When identifying achievements, prefer concrete
    accomplishments, metrics, percentages, numbers,
    improvements, savings, growth, performance results,
    or delivered outcomes when they are actually present.

12. Do not convert responsibilities into achievements
    unless the resume explicitly supports that interpretation.

13. Keep the analysis concise enough for a dashboard,
    while still providing useful information.

14. If the resume contains insufficient information for
    a field, do not fabricate information.

Return only information that can be supported by the
provided resume.
        `,
      },

      {
        role: "user",

        content: `
Analyze the following resume.

--- RESUME START ---

${resumeText}

--- RESUME END ---
        `,
      },
    ],

    text: {
      format: zodTextFormat(
        ResumeAnalysisSchema,
        "resume_analysis"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "The AI did not return a valid resume analysis."
    );
  }

  return response.output_parsed;
}