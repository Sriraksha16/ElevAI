import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export const JobMatchSchema = z.object({
  jobProfile: z.object({
    jobTitle: z.string(),
    company: z.string(),
    seniorityLevel: z.string(),
    summary: z.string(),
  }),

  requirements: z.object({
    requiredSkills: z.array(z.string()),
    preferredSkills: z.array(z.string()),
    qualifications: z.array(z.string()),
    experienceRequirements: z.array(z.string()),
  }),

  match: z.object({
    score: z.number().min(0).max(100),

    matchedSkills: z.array(z.string()),

    missingSkills: z.array(z.string()),

    matchingKeywords: z.array(z.string()),

    missingKeywords: z.array(z.string()),

    experienceAlignment: z.string(),

    strengths: z.array(z.string()),

    recommendations: z.array(z.string()),
  }),
});

export type JobMatch = z.infer<typeof JobMatchSchema>;

export async function matchResumeToJob(
  resumeText: string,
  jobDescription: string
): Promise<JobMatch> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!resumeText.trim()) {
    throw new Error("Resume text is empty.");
  }

  if (!jobDescription.trim()) {
    throw new Error("Job description is empty.");
  }

  const response = await openai.responses.parse({
    model: "gpt-5.6",

    input: [
      {
        role: "system",
        content: `
You are ElevAI, an AI-powered career and job matching engine.

Your task is to compare a candidate's resume with a specific
job description and produce a structured job-match analysis.

IMPORTANT RULES:

1. Use ONLY information supported by the resume and job description.

2. Never invent candidate experience, skills, education,
   certifications, job titles, achievements, or qualifications.

3. Never assume the candidate has a skill simply because
   it is common for their profession or job title.

4. Separate:
   - skills clearly present in the resume
   - skills required or preferred by the job
   - skills missing from the resume

5. Distinguish required skills from preferred skills whenever
   the job description makes that distinction.

6. The match score must reflect the actual relationship between
   the candidate's resume and the supplied job description.

7. Consider the following when determining the match:
   - technical skills
   - tools and technologies
   - relevant experience
   - seniority
   - education requirements
   - certifications
   - responsibilities
   - domain-specific requirements
   - important job-description keywords

8. Do not treat every keyword as equally important.

9. Do not claim that a candidate is qualified for a requirement
   unless the resume provides supporting evidence.

10. Do not penalize the candidate for information that the
    job description does not require.

11. Missing skills should identify potentially important
    requirements that are not supported by the resume.

12. Matching keywords should represent meaningful overlap
    between the resume and the job description.

13. Missing keywords should represent meaningful job-related
    terms present in the job description but not clearly
    supported by the resume.

14. Experience alignment should briefly explain how the
    candidate's documented experience compares with the
    experience requested by the job.

15. Recommendations must be practical and based on the
    actual gaps identified.

16. Do not judge the candidate personally.

17. Do not fabricate a company name. If the job description
    does not identify a company, return an empty string.

18. If the job title is not explicitly provided, infer it only
    when the job description clearly identifies it. Otherwise
    return an appropriate unavailable value.

19. Keep the analysis concise enough for a dashboard.

20. Return only information supported by the supplied
    resume and job description.
        `,
      },

      {
        role: "user",
        content: `
Compare the following resume with the following job description.

================ RESUME ================

${resumeText}

================ JOB DESCRIPTION ================

${jobDescription}

==========================================
        `,
      },
    ],

    text: {
      format: zodTextFormat(
        JobMatchSchema,
        "job_match"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "The AI did not return a valid job match analysis."
    );
  }

  return response.output_parsed;
}