import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

export const InterviewCoachSchema = z.object({
  interviewProfile: z.object({
    role: z.string(),
    company: z.string(),
    experienceLevel: z.string(),
    candidatePositioning: z.string(),
  }),

  preparationSummary: z.object({
    strengthsToEmphasize: z.array(z.string()),
    areasToPrepare: z.array(z.string()),
    preparationPriorities: z.array(z.string()),
  }),

  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      whyItMayBeAsked: z.string(),
      whatToCover: z.array(z.string()),
      difficulty: z.enum([
        "basic",
        "intermediate",
        "advanced",
      ]),
    })
  ),

  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      whyItMayBeAsked: z.string(),
      whatToCover: z.array(z.string()),
    })
  ),

  resumeQuestions: z.array(
    z.object({
      question: z.string(),
      resumeEvidence: z.string(),
      preparationGuidance: z.string(),
    })
  ),

  jobSpecificQuestions: z.array(
    z.object({
      question: z.string(),
      relatedRequirement: z.string(),
      whatToCover: z.array(z.string()),
    })
  ),

  answerGuidance: z.array(
    z.object({
      question: z.string(),
      structure: z.string(),
      keyPoints: z.array(z.string()),
    })
  ),
});

export type InterviewCoachResult = z.infer<
  typeof InterviewCoachSchema
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

export async function generateInterviewPreparation(
  resumeText: string,
  jobDescription: string
): Promise<InterviewCoachResult> {
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
You are ElevAI's AI Interview Coach.

Your job is to help a candidate prepare for a specific job interview using ONLY:
1. The candidate's resume.
2. The job description.

IMPORTANT RULES:

- Never invent experience.
- Never invent projects.
- Never invent technologies the candidate has used.
- Never invent achievements.
- Never claim the candidate has a skill that is not supported by the resume.
- Questions may test technologies mentioned in the job description even if the candidate does not currently have them.
- Clearly distinguish candidate evidence from job requirements.
- Do not promise that a particular question will be asked.
- Do not predict whether the candidate will pass the interview.
- Do not make assumptions about the interviewer's preferences.
- Use the resume to create realistic resume-specific questions.
- Use the job description to create realistic role-specific questions.
- Include both technical and behavioral preparation.
- For technical questions, explain what concepts the candidate should prepare.
- For behavioral questions, encourage evidence-based answers.
- For resume questions, identify the actual resume evidence that may lead to the question.
- Preparation guidance should be practical and concise.
- Avoid generic questions when the resume or job description provides enough information to make them specific.

Create a structured interview preparation plan.
        `,
      },
      {
        role: "user",
        content: `
Prepare the candidate for an interview.

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Analyze both documents.

Identify:
- The role and company if explicitly available.
- The candidate's actual positioning.
- Strengths relevant to the role.
- Areas that may require preparation.
- Technical topics relevant to the job.
- Behavioral questions relevant to the role.
- Questions specifically connected to the candidate's resume.
- Questions specifically connected to the job requirements.
- Practical guidance for preparing answers.

Do not fabricate candidate experience.
        `,
      },
    ],

    text: {
      format: zodTextFormat(
        InterviewCoachSchema,
        "interview_coach_result"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "The AI did not return valid interview preparation."
    );
  }

  return response.output_parsed;
}