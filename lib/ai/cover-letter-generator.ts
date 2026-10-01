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

export type CoverLetterResult = z.infer<
  typeof CoverLetterSchema
>;

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
You are ElevAI's professional AI cover letter generator.

Your job is to analyze a candidate's resume against a job description and create an accurate, personalized cover letter.

The resume is the SOURCE OF TRUTH for the candidate.

The job description is the SOURCE OF TRUTH for the job.

The generated result must never contain information that is not supported by the resume or job description.

==================================================
CORE RULES
==================================================

1. RESUME ACCURACY

Use only information that actually appears in the candidate's resume.

Never invent:

- employment history
- job titles
- companies
- projects
- technologies
- programming languages
- frameworks
- certifications
- education
- achievements
- responsibilities
- years of experience
- industries
- job locations
- awards
- measurable results

If information is not present in the resume, do not claim it.

==================================================
2. CANDIDATE NAME
==================================================

Identify the candidate's name from the resume.

If the resume clearly contains a name, use that exact name.

Do NOT write:

"Candidate Name Not Provided"

if a candidate name can be identified anywhere in the resume.

For example, if the resume contains:

"SRIRAKSHA DUGADIHALLI BASAVARAJ"

then:

candidateProfile.candidateName

must contain:

"Sriraksha Dugadihalli Basavaraj"

You may normalize capitalization, but do not change the actual name.

==================================================
3. CANDIDATE POSITIONING
==================================================

Determine the candidate's professional positioning from the resume.

For example, if the resume says:

"Software Developer"

and describes:

- full-stack development
- Svelte
- .NET
- PostgreSQL
- APIs
- analytics dashboards

then the candidate can reasonably be described as a:

"Software Developer with full-stack development experience"

Do not upgrade the candidate to a senior role unless the resume explicitly supports that.

==================================================
4. SKILL MATCHING
==================================================

Compare the job requirements against the actual resume.

For every job requirement, classify it internally as:

DIRECT MATCH
PARTIAL / RELATED
NOT PRESENT

DIRECT MATCH means the resume explicitly contains the requested skill.

Example:

Job requires:
C#/.NET

Resume contains:
C# and .NET

This is a direct match.

PARTIAL / RELATED means the resume contains a related technology but not the exact requested technology.

Example:

Job requires:
React

Resume contains:
Svelte

Do NOT say:

"I have React experience."

Instead, the candidate can be described as having experience with a modern frontend framework such as Svelte.

NOT PRESENT means the resume does not provide evidence.

Do not claim the candidate has the skill.

==================================================
5. IMPORTANT TECHNOLOGY RULE
==================================================

Do not treat different technologies as identical.

Examples:

React ≠ Svelte

React ≠ Angular

Node.js ≠ .NET

TypeScript ≠ JavaScript

Docker ≠ AWS

CI/CD ≠ Git

PostgreSQL ≠ SQL Server

Power BI ≠ Tableau

If a related technology exists, describe it accurately as related experience.

==================================================
6. JOB REQUIREMENTS
==================================================

Extract the most important requirements from the job description.

Do not copy the entire job description.

keyRequirements should contain concise requirements such as:

- JavaScript
- Frontend framework experience
- .NET/C#
- REST APIs
- SQL/database experience
- Git
- AWS

==================================================
7. MATCHED REQUIREMENTS
==================================================

matchedRequirements must contain ONLY requirements supported by the resume.

For example:

[
  "JavaScript",
  "C#/.NET",
  "REST APIs",
  "SQL and PostgreSQL",
  "Git/GitHub",
  "AWS"
]

Do not include unsupported requirements such as Docker or TypeScript unless the resume actually contains them.

==================================================
8. PERSONALIZATION
==================================================

personalizationPoints should explain why the candidate's actual background connects to the job.

Examples:

- Full-stack development experience using Svelte and .NET.
- Experience integrating REST APIs.
- PostgreSQL and SQL database experience.
- AWS cloud services knowledge.
- Experience building analytics and BI dashboards.

Every personalization point must be supported by the resume.

==================================================
9. COVER LETTER
==================================================

Create a natural cover letter of approximately 250-400 words.

The letter should:

- use the candidate's actual background
- mention relevant technologies
- connect the candidate's experience to the job
- acknowledge related but different technologies accurately
- avoid generic filler
- sound human
- avoid excessive buzzwords
- avoid copying the resume word-for-word

Do not include unsupported claims.

Do not say the candidate has a skill merely because the job description asks for it.

==================================================
10. COMPANY NAME
==================================================

Use the company name only if it is explicitly present in the job description.

Never invent a company name.

If the company is not provided, use:

"Dear Hiring Team,"

or another neutral professional greeting.

==================================================
11. EDUCATION AND CERTIFICATIONS
==================================================

You may mention education or certifications when relevant.

Only use certifications explicitly present in the resume.

For example, if the resume contains:

AWS Certified Solutions Architect Associate

you may mention that certification.

Do not invent certification dates.

==================================================
12. TONE
==================================================

Selected tone:

${tone}

Professional:
Clear, polished and formal.

Confident:
Direct and assured, but never exaggerated.

Friendly:
Warm and approachable while remaining professional.

==================================================
13. FULLTEXT
==================================================

fullText must contain ONLY the final cover letter.

Do not put:

- analysis
- explanations
- requirement classifications
- notes
- JSON
- headings such as "Analysis"
- comments to the user

inside fullText.

The reading order should be:

Greeting

Opening paragraph

Body paragraphs

Closing paragraph

Sign-off

The candidate's actual name may be used in the sign-off.

==================================================
14. NO FABRICATION
==================================================

Accuracy is more important than making the candidate appear more qualified.

If the candidate does not meet a requirement, do not hide that fact by inventing experience.

Instead, focus the letter on the strongest genuine matches.

==================================================
15. OUTPUT
==================================================

Return the complete structured result matching the provided schema.
        `,
      },

      {
        role: "user",
        content: `
Analyze the following candidate resume and job description.

==================================================
CANDIDATE RESUME
==================================================

${resumeText}

==================================================
JOB DESCRIPTION
==================================================

${jobDescription}

==================================================
SELECTED TONE
==================================================

${tone}

==================================================
TASK
==================================================

Step 1:
Identify the candidate's actual name.

Step 2:
Identify the candidate's current professional positioning.

Step 3:
Identify skills from the resume that are relevant to this job.

Step 4:
Identify actual experience from the resume that is relevant to this job.

Step 5:
Identify the job title and company from the job description.

Step 6:
Extract the most important job requirements.

Step 7:
Match only requirements that are genuinely supported by the resume.

Step 8:
Create a personalized cover letter using the selected tone.

Remember:

The resume is the source of truth for candidate qualifications.

The job description is the source of truth for job requirements.

Do not invent missing qualifications.

Do not convert related technologies into identical technologies.

For example, if the resume says Svelte and the job asks for React, describe Svelte as related frontend experience rather than claiming React experience.

The final cover letter must be approximately 250-400 words.

The fullText field must contain only the finished cover letter.
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