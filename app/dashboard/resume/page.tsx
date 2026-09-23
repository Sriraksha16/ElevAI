"use client";

import { useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Target,
  Wrench,
} from "lucide-react";

import { PageBackLink } from "@/components/dashboard/PageBackLink";
import { ResumeWorkspace } from "@/components/dashboard/ResumeWorkspace";

import type { ResumeAnalysis } from "@/lib/ai/resume-analyzer";
import type { ResumeScores } from "@/lib/scoring/resume-score";

export default function ResumePage() {
  const [analysis, setAnalysis] =
    useState<ResumeAnalysis | null>(null);

  const [scores, setScores] =
    useState<ResumeScores | null>(null);

  function handleAnalysisComplete(
    nextAnalysis: ResumeAnalysis,
    nextScores: ResumeScores
  ) {
    setAnalysis(nextAnalysis);
    setScores(nextScores);
  }

  function handleAnalysisReset() {
    setAnalysis(null);
    setScores(null);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PageBackLink />

        {/* Header */}

        <div className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
              <FileText className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-indigo-400">
                Resume Intelligence
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Resume
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Upload your resume and let ElevAI analyze
                its content, ATS readiness, skills and
                career opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Upload / Analyze */}

        <div className="mt-8">
          <ResumeWorkspace
            onAnalysisComplete={
              handleAnalysisComplete
            }
            onAnalysisReset={
              handleAnalysisReset
            }
          />
        </div>

        {/* Analysis Results */}

        {analysis && scores && (
          <div className="mt-8 space-y-6">
            {/* Score Cards */}

            <section className="grid gap-4 md:grid-cols-3">
              <ScoreCard
                label="ATS Score"
                value={scores.atsScore}
                icon={<Target className="h-5 w-5" />}
              />

              <ScoreCard
                label="Career Health"
                value={scores.careerHealth}
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
              />

              <ScoreCard
                label="Interview Readiness"
                value={scores.interviewReadiness}
                icon={
                  <BriefcaseBusiness className="h-5 w-5" />
                }
              />
            </section>

            {/* Candidate Profile */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <SectionHeader
                icon={
                  <BriefcaseBusiness className="h-5 w-5" />
                }
                title="Candidate Profile"
              />

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Professional Summary
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {
                      analysis.candidateProfile
                        .professionalSummary
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Experience Level
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {
                      analysis.candidateProfile
                        .experienceLevel
                    }
                  </p>

                  {analysis.candidateProfile
                    .targetRoles.length > 0 && (
                    <>
                      <p className="mt-5 text-xs uppercase tracking-wider text-slate-500">
                        Target Roles
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {analysis.candidateProfile.targetRoles.map(
                          (role, index) => (
                            <span
                              key={`${role}-${index}`}
                              className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300"
                            >
                              {role}
                            </span>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Skills */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <SectionHeader
                icon={<Wrench className="h-5 w-5" />}
                title="Skills"
              />

              <div className="mt-5 grid gap-6 lg:grid-cols-3">
                <SkillGroup
                  title="Technical"
                  items={analysis.skills.technical}
                />

                <SkillGroup
                  title="Tools & Technologies"
                  items={
                    analysis.skills
                      .toolsAndTechnologies
                  }
                />

                <SkillGroup
                  title="Soft Skills"
                  items={analysis.skills.soft}
                />
              </div>
            </section>

            {/* ATS Analysis */}

            <section className="grid gap-6 lg:grid-cols-2">
              <AnalysisList
                title="ATS Strengths"
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
                items={analysis.ats.strengths}
                emptyMessage="No specific strengths were identified."
              />

              <AnalysisList
                title="ATS Weaknesses"
                icon={
                  <Target className="h-5 w-5" />
                }
                items={analysis.ats.weaknesses}
                emptyMessage="No specific weaknesses were identified."
              />
            </section>

            {/* Missing Keywords */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <SectionHeader
                icon={<Target className="h-5 w-5" />}
                title="Missing Keywords"
              />

              {analysis.ats.missingKeywords.length >
              0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {analysis.ats.missingKeywords.map(
                    (keyword, index) => (
                      <span
                        key={`${keyword}-${index}`}
                        className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300"
                      >
                        {keyword}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No missing keywords were identified.
                </p>
              )}
            </section>

            {/* Career Analysis */}

            <section className="grid gap-6 lg:grid-cols-2">
              <AnalysisList
                title="Skill Gaps"
                icon={
                  <Target className="h-5 w-5" />
                }
                items={analysis.career.skillGaps}
                emptyMessage="No specific skill gaps were identified."
              />

              <AnalysisList
                title="Recommendations"
                icon={
                  <Lightbulb className="h-5 w-5" />
                }
                items={analysis.career.recommendations}
                emptyMessage="No recommendations were returned."
              />
            </section>

            {/* Suggested Improvements */}

            <AnalysisList
              title="Suggested Resume Improvements"
              icon={
                <FileText className="h-5 w-5" />
              }
              items={
                analysis.career
                  .suggestedImprovements
              }
              emptyMessage="No specific improvements were suggested."
            />

            {/* Experience */}

            {analysis.experience.roles.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <SectionHeader
                  icon={
                    <BriefcaseBusiness className="h-5 w-5" />
                  }
                  title="Experience"
                />

                <div className="mt-5 space-y-5">
                  {analysis.experience.roles.map(
                    (role, index) => (
                      <div
                        key={`${role.title}-${index}`}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                      >
                        <h3 className="font-medium text-white">
                          {role.title}
                        </h3>

                        <p className="mt-1 text-sm text-indigo-300">
                          {role.company}
                        </p>

                        {role.responsibilities
                          .length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              Responsibilities
                            </p>

                            <ul className="mt-2 space-y-2">
                              {role.responsibilities.map(
                                (
                                  item,
                                  itemIndex
                                ) => (
                                  <li
                                    key={
                                      itemIndex
                                    }
                                    className="text-sm leading-6 text-slate-400"
                                  >
                                    • {item}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {role.achievements
                          .length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              Achievements
                            </p>

                            <ul className="mt-2 space-y-2">
                              {role.achievements.map(
                                (
                                  item,
                                  itemIndex
                                ) => (
                                  <li
                                    key={
                                      itemIndex
                                    }
                                    className="text-sm leading-6 text-slate-400"
                                  >
                                    • {item}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Education */}

            {analysis.education.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <SectionHeader
                  icon={
                    <GraduationCap className="h-5 w-5" />
                  }
                  title="Education"
                />

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {analysis.education.map(
                    (education, index) => (
                      <div
                        key={`${education.degree}-${index}`}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                      >
                        <h3 className="font-medium text-white">
                          {education.degree}
                        </h3>

                        <p className="mt-1 text-sm text-slate-300">
                          {education.field}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {education.institution}
                        </p>

                        {education.year && (
                          <p className="mt-1 text-xs text-slate-600">
                            {education.year}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Certifications */}

            {analysis.certifications.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <SectionHeader
                  icon={
                    <Award className="h-5 w-5" />
                  }
                  title="Certifications"
                />

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {analysis.certifications.map(
                    (certification, index) => (
                      <div
                        key={`${certification.name}-${index}`}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                      >
                        <h3 className="font-medium text-white">
                          {certification.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {certification.issuer}
                        </p>

                        {certification.year && (
                          <p className="mt-2 text-xs text-slate-600">
                            {certification.year}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ----------------------------------------
   Score Card
----------------------------------------- */

function ScoreCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          {icon}
        </div>

        <span className="text-3xl font-semibold text-white">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-200">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Based on the current resume analysis
      </p>
    </div>
  );
}

/* ----------------------------------------
   Section Header
----------------------------------------- */

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <h2 className="font-medium text-white">
        {title}
      </h2>
    </div>
  );
}

/* ----------------------------------------
   Skill Group
----------------------------------------- */

function SkillGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {title}
      </p>

      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          None identified
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------
   Analysis List
----------------------------------------- */

function AnalysisList({
  title,
  icon,
  items,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <SectionHeader
        icon={icon}
        title={title}
      />

      {items.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-slate-400"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}