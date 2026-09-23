import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const CareerInsightsSchema = z.object({
  careerProfile: z.object({
    currentPositioning: z.string(),
    experienceLevel: z.string(),
    strongestAreas: z.array(z.string()),
    potentialRoleDirections: z.array(z.string()),
  }),

  skillAnalysis: z.object({
    currentSkills: z.array(z.string()),
    skillGaps: z.array(z.string()),
    prioritySkills: z.array(
      z.object({
        skill: z.string(),
        reason: z.string(),
        priority: z.enum([
          "high",
          "medium",
          "low",
        ]),
      })
    ),
  }),

  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      action: z.string(),
    })
  ),

  resumeImprovements: z.array(
    z.object({
      area: z.string(),
      issue: z.string(),
      recommendation: z.string(),
    })
  ),

  learningPlan: z.array(
    z.object({
      topic: z.string(),
      reason: z.string(),
      suggestedAction: z.string(),
    })
  ),
});

export type CareerInsights = z.infer<
  typeof CareerInsightsSchema
>;

export async function generateCareerInsights(
  resumeText: string
): Promise<CareerInsights> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
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
You are ElevAI, an AI career intelligence engine.

Your task is to analyze a candidate's resume and provide
practical career insights based ONLY on information supported
by the resume.

IMPORTANT RULES:

1. Never invent employment history, education, skills,
   certifications, achievements, companies, job titles,
   technologies, or experience.

2. Clearly distinguish between:
   - skills explicitly shown in the resume
   - reasonable observations based on documented experience
   - potential skill gaps

3. Do not assume a candidate has a skill simply because
   it is common for their job title.

4. Potential role directions must be based on the candidate's
   documented skills and experience.

5. Do not guarantee that the candidate will qualify for a role.

6. Do not predict hiring outcomes, salary, or employment success.

7. Skill gaps should identify areas that could reasonably
   strengthen the candidate's profile based on their existing
   experience and apparent career direction.

8. Priority skills should be practical and explain why the
   skill may be useful.

9. Recommendations must be actionable.

10. Resume improvements must identify actual issues or
    opportunities visible in the supplied resume.

11. Do not criticize the candidate personally.

12. Do not fabricate missing information.

13. If the resume does not provide enough information for
    a field, use an empty array or clearly indicate that
    information is unavailable.

14. Keep the output concise enough for a dashboard while
    providing useful career guidance.

15. Learning recommendations should focus on realistic,
    relevant development areas supported by the resume.

Return only information supported by the supplied resume.
        `,
      },

      {
        role: "user",
        content: `
Analyze the following resume and generate career insights.

================ RESUME ================

${resumeText}

==========================================
        `,
      },
    ],

    text: {
      format: zodTextFormat(
        CareerInsightsSchema,
        "career_insights"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "The AI did not return valid career insights."
    );
  }

  return response.output_parsed;
}