"use client";

import { useState } from "react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResumeWorkspace } from "@/components/dashboard/ResumeWorkspace";
import type { ResumeAnalysis } from "@/lib/ai/resume-analyzer";
import type { ResumeScores } from "@/lib/scoring/resume-score";

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [scores, setScores] = useState<ResumeScores | null>(null);

  const handleAnalysisComplete = (
    nextAnalysis: ResumeAnalysis,
    nextScores: ResumeScores
  ) => {
    setAnalysis(nextAnalysis);
    setScores(nextScores);
  };

  const handleAnalysisReset = () => {
    setAnalysis(null);
    setScores(null);
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1">
          {/* Top bar */}
          <DashboardHeader
            name="Sriraksha"
            role="Career Explorer"
          />

          {/* Dashboard */}
          <div className="px-6 py-8 lg:px-10">
            {/* Introduction */}
            <div>
              <p className="text-sm text-indigo-400">
                Your career intelligence
              </p>

              <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight">
                Your career at a glance.
              </h2>

              <p className="mt-2 max-w-2xl text-slate-400">
                Track your resume strength, application readiness, and AI
                recommendations from one workspace.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StatCard
                label="Career Health"
                value={
                  scores
                    ? `${scores.careerHealth}%`
                    : "—"
                }
                description={
                  scores
                    ? "Calculated from your resume analysis"
                    : "Upload your resume to analyze"
                }
              />

              <StatCard
                label="ATS Score"
                value={
                  scores
                    ? `${scores.atsScore}%`
                    : "—"
                }
                description={
                  scores
                    ? "Based on your resume"
                    : "Upload your resume to analyze"
                }
              />

              <StatCard
                label="Interview Ready"
                value={
                  scores
                    ? `${scores.interviewReadiness}%`
                    : "—"
                }
                description={
                  scores
                    ? "Calculated from your resume analysis"
                    : "Upload your resume to analyze"
                }
              />
            </div>

            {/* Resume Workspace */}
            <ResumeWorkspace
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisReset={handleAnalysisReset}
            />

            {/* Analysis results */}
            {analysis && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">
                {/* Candidate Profile */}
                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <h3 className="font-heading text-lg font-semibold">
                    Candidate Profile
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {analysis.candidateProfile.professionalSummary}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/2 p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Experience Level
                      </p>

                      <p className="mt-2 text-sm text-slate-300">
                        {analysis.candidateProfile.experienceLevel}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/2 p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Target Roles
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {analysis.candidateProfile.targetRoles.length > 0 ? (
                          analysis.candidateProfile.targetRoles.map(
                            (role) => (
                              <span
                                key={role}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300"
                              >
                                {role}
                              </span>
                            )
                          )
                        ) : (
                          <span className="text-sm text-slate-500">
                            No target roles identified.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ATS Strengths */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    Resume Strengths
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.ats.strengths.length > 0 ? (
                      analysis.ats.strengths.map((strength) => (
                        <div
                          key={strength}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                        >
                          {strength}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No specific strengths detected yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* ATS Weaknesses */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    ATS Weaknesses
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.ats.weaknesses.length > 0 ? (
                      analysis.ats.weaknesses.map((weakness) => (
                        <div
                          key={weakness}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                        >
                          {weakness}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No major ATS weaknesses detected.
                      </p>
                    )}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    Missing Keywords
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.ats.missingKeywords.length > 0 ? (
                      analysis.ats.missingKeywords.map((keyword) => (
                        <div
                          key={keyword}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                        >
                          {keyword}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No major missing keywords detected.
                      </p>
                    )}
                  </div>
                </div>

                {/* Skill Gaps */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    Skill Gaps
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.career.skillGaps.length > 0 ? (
                      analysis.career.skillGaps.map((gap) => (
                        <div
                          key={gap}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                        >
                          {gap}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No major skill gaps detected.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <h3 className="font-heading text-lg font-semibold">
                    AI Recommendations
                  </h3>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {analysis.career.recommendations.length > 0 ? (
                      analysis.career.recommendations.map(
                        (recommendation) => (
                          <div
                            key={recommendation}
                            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                          >
                            {recommendation}
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-slate-500">
                        No recommendations available yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Suggested Improvements */}
                <div className="glass rounded-2xl p-6 lg:col-span-2">
                  <h3 className="font-heading text-lg font-semibold">
                    Suggested Improvements
                  </h3>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {analysis.career.suggestedImprovements.length > 0 ? (
                      analysis.career.suggestedImprovements.map(
                        (improvement) => (
                          <div
                            key={improvement}
                            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                          >
                            {improvement}
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-slate-500">
                        No improvement suggestions available yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    Technical Skills
                  </h3>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {analysis.skills.technical.length > 0 ? (
                      analysis.skills.technical.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        No technical skills detected.
                      </span>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    Certifications
                  </h3>

                  <div className="mt-5 space-y-3">
                    {analysis.certifications.length > 0 ? (
                      analysis.certifications.map((certification) => (
                        <div
                          key={`${certification.name}-${certification.issuer}-${certification.year}`}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                        >
                          <p className="text-sm font-medium text-slate-200">
                            {certification.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {certification.issuer}
                            {certification.year
                              ? ` • ${certification.year}`
                              : ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No certifications detected.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Empty state */}
            {!analysis && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold">
                      Recent Analysis
                    </h3>

                    <span className="text-xs text-slate-500">
                      No analyses yet
                    </span>
                  </div>

                  <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
                    <p className="text-sm text-slate-400">
                      Your resume analyses will appear here.
                    </p>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    AI Recommendations
                  </h3>

                  <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
                    <p className="text-sm text-slate-400">
                      AI recommendations will appear after your first
                      analysis.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}