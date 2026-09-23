import type { ResumeAnalysis } from "@/lib/ai/resume-analyzer";

export type ResumeScores = {
  atsScore: number;
  careerHealth: number;
  interviewReadiness: number;
};

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function calculateResumeScores(
  analysis: ResumeAnalysis
): ResumeScores {
  /*
   * ATS SCORE
   *
   * This comes from the structured ATS analysis.
   * The AI evaluates the resume itself, but the score
   * is validated by our Zod schema to stay between 0-100.
   */
  const atsScore = clampScore(analysis.ats.score);

  /*
   * CAREER HEALTH
   *
   * Start with ATS readiness.
   * Then adjust according to strengths, weaknesses,
   * and identified skill gaps.
   */
  const strengthBonus =
    Math.min(15, analysis.ats.strengths.length * 3);

  const weaknessPenalty =
    Math.min(15, analysis.ats.weaknesses.length * 2);

  const skillGapPenalty =
    Math.min(15, analysis.career.skillGaps.length * 2);

  const careerHealth = clampScore(
    atsScore +
      strengthBonus -
      weaknessPenalty -
      skillGapPenalty
  );

  /*
   * INTERVIEW READINESS
   *
   * Interview readiness considers:
   * - ATS readiness
   * - strengths
   * - weaknesses
   * - career skill gaps
   */
  const interviewStrength =
    Math.min(10, analysis.ats.strengths.length * 2);

  const interviewPenalty =
    Math.min(
      20,
      (analysis.ats.weaknesses.length +
        analysis.career.skillGaps.length) *
        2
    );

  const interviewReadiness = clampScore(
    atsScore +
      interviewStrength -
      interviewPenalty
  );

  return {
    atsScore,
    careerHealth,
    interviewReadiness,
  };
}