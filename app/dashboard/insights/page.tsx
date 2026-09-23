"use client";

import { useRef, useState } from "react";
import {
  BrainCircuit,
  FileText,
  Lightbulb,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";

import { PageBackLink } from "@/components/dashboard/PageBackLink";

type CareerInsights = {
  careerProfile: {
    currentPositioning: string;
    experienceLevel: string;
    strongestAreas: string[];
    potentialRoleDirections: string[];
  };

  skillAnalysis: {
    currentSkills: string[];
    skillGaps: string[];
    prioritySkills: {
      skill: string;
      reason: string;
      priority: "high" | "medium" | "low";
    }[];
  };

  recommendations: {
    title: string;
    description: string;
    action: string;
  }[];

  resumeImprovements: {
    area: string;
    issue: string;
    recommendation: string;
  }[];

  learningPlan: {
    topic: string;
    reason: string;
    suggestedAction: string;
  }[];
};

export default function InsightsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [insights, setInsights] =
    useState<CareerInsights | null>(null);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [error, setError] = useState("");

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setError("Please upload a PDF or DOCX resume.");
      return;
    }

    if (file.size > maxSize) {
      setSelectedFile(null);
      setError("Your resume must be smaller than 5 MB.");
      return;
    }

    setSelectedFile(file);
    setInsights(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setInsights(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateInsights = async () => {
    if (!selectedFile) {
      setError("Please upload your resume first.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setInsights(null);

    try {
      const formData = new FormData();

      formData.append("resume", selectedFile);

      const response = await fetch(
        "/api/career-insights",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Career insights generation failed."
        );
      }

      if (!data.insights) {
        throw new Error(
          "No career insights were returned."
        );
      }

      setInsights(data.insights);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating career insights."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {/* Back */}
        <PageBackLink />

        {/* Header */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-6 w-6 text-indigo-400" />

            <p className="text-sm text-indigo-400">
              Career intelligence
            </p>
          </div>

          <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight">
            AI Career Insights
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Upload your resume to discover potential career
            directions, skill priorities, practical
            recommendations, and areas where your profile
            could be strengthened.
          </p>
        </div>

        {/* Upload workspace */}
        {!insights && (
          <section className="mt-8">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-400" />

                <h2 className="font-heading text-lg font-semibold">
                  Resume for Career Analysis
                </h2>
              </div>

              {!selectedFile ? (
                <button
                  type="button"
                  onClick={handleChooseFile}
                  className="mx-auto mt-6 flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center transition hover:border-indigo-400/40 hover:bg-white/[0.04]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Upload className="h-5 w-5 text-indigo-400" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-200">
                    Upload your resume
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    PDF or DOCX • Maximum 5 MB
                  </p>
                </button>
              ) : (
                <div className="mx-auto mt-6 max-w-md rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-indigo-400" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {selectedFile.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(
                          2
                        )}{" "}
                        MB
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                      aria-label="Remove resume"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Generate */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerateInsights}
                  disabled={
                    !selectedFile || isAnalyzing
                  }
                  className="flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />

                  {isAnalyzing
                    ? "Generating..."
                    : "Generate Insights"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Results */}
        {insights && (
          <section className="mt-8 space-y-6">
            {/* Career profile */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-indigo-400" />

                <h2 className="font-heading text-lg font-semibold">
                  Career Profile
                </h2>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Current Positioning
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {insights.careerProfile.currentPositioning}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Experience Level
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {insights.careerProfile.experienceLevel}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Strongest Areas
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {insights.careerProfile.strongestAreas.map(
                    (area) => (
                      <span
                        key={area}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300"
                      >
                        {area}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Potential Role Directions
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {insights.careerProfile.potentialRoleDirections.map(
                    (role) => (
                      <div
                        key={role}
                        className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                      >
                        {role}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass rounded-2xl p-6">
                <h2 className="font-heading text-lg font-semibold">
                  Current Skills
                </h2>

                <div className="mt-5 flex flex-wrap gap-2">
                  {insights.skillAnalysis.currentSkills.map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="font-heading text-lg font-semibold">
                  Skill Gaps
                </h2>

                <div className="mt-5 space-y-3">
                  {insights.skillAnalysis.skillGaps.map(
                    (gap) => (
                      <div
                        key={gap}
                        className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                      >
                        {gap}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Priority skills */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold">
                Priority Skills
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {insights.skillAnalysis.prioritySkills.map(
                  (item) => (
                    <div
                      key={item.skill}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-200">
                          {item.skill}
                        </p>

                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400">
                          {item.priority}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {item.reason}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-indigo-400" />

                <h2 className="font-heading text-lg font-semibold">
                  Career Recommendations
                </h2>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {insights.recommendations.map(
                  (recommendation) => (
                    <div
                      key={recommendation.title}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                    >
                      <h3 className="text-sm font-semibold text-slate-200">
                        {recommendation.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {recommendation.description}
                      </p>

                      <div className="mt-4 rounded-lg border border-indigo-400/10 bg-indigo-500/5 px-3 py-2">
                        <p className="text-xs text-indigo-300">
                          Action
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {recommendation.action}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Resume improvements */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold">
                Resume Improvements
              </h2>

              <div className="mt-5 space-y-4">
                {insights.resumeImprovements.map(
                  (item) => (
                    <div
                      key={`${item.area}-${item.issue}`}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                    >
                      <p className="text-sm font-semibold text-slate-200">
                        {item.area}
                      </p>

                      <p className="mt-2 text-sm text-slate-400">
                        {item.issue}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {item.recommendation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Learning plan */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading text-lg font-semibold">
                Learning Plan
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {insights.learningPlan.map(
                  (item) => (
                    <div
                      key={item.topic}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                    >
                      <h3 className="text-sm font-semibold text-slate-200">
                        {item.topic}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        {item.reason}
                      </p>

                      <p className="mt-3 text-sm text-slate-300">
                        {item.suggestedAction}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Analyze another resume */}
            <div className="flex justify-center pb-8">
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
              >
                Analyze Another Resume
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}