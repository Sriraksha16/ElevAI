
"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

type ResumeAnalysis = {
  candidateProfile?: {
    professionalSummary?: string;
    experienceLevel?: string;
    targetRoles?: string[];
  };
  skills?: {
    technical?: string[];
    soft?: string[];
    toolsAndTechnologies?: string[];
  };
  ats?: {
    score?: number;
    strengths?: string[];
    weaknesses?: string[];
    missingKeywords?: string[];
  };
  career?: {
    skillGaps?: string[];
    recommendations?: string[];
    suggestedImprovements?: string[];
  };
};

type ResumeVersion = {
  version: number;
  resumeId: string;
  analysisId: string | null;
  fileName: string;
  fileType: string;
  createdAt: string;
  analysis: ResumeAnalysis | null;
  scores: Record<string, unknown> | null;
};

type AnalyzeResponse = {
  success: boolean;
  cached?: boolean;
  message: string;
  resumeId?: string;
  analysisId?: string;
  fileName?: string;
  analysis?: ResumeAnalysis;
  scores?: Record<string, unknown>;
};

type HistoryResponse = {
  success: boolean;
  message?: string;
  versions?: ResumeVersion[];
};

export default function ResumePage() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [selectedVersion, setSelectedVersion] =
    useState<ResumeVersion | null>(null);

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadHistory(): Promise<ResumeVersion[]> {
    const response = await fetch("/api/resume/history", {
      method: "GET",
      cache: "no-store",
    });

    const data = (await response.json()) as HistoryResponse;

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load resume history.");
    }

    const loadedVersions = data.versions ?? [];

    setVersions(loadedVersions);

    if (loadedVersions.length > 0) {
      setSelectedVersion(loadedVersions[loadedVersions.length - 1]);
    } else {
      setSelectedVersion(null);
    }

    setError("");
    return loadedVersions;
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchInitialHistory() {
      try {
        const response = await fetch("/api/resume/history", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as HistoryResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load resume history.");
        }

        if (cancelled) return;

        const loadedVersions = data.versions ?? [];
        setVersions(loadedVersions);
        setSelectedVersion(
          loadedVersions.length > 0
            ? loadedVersions[loadedVersions.length - 1]
            : null
        );
        setError("");
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load resume history."
        );
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    void fetchInitialHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Resume analysis failed.");
      }

      setMessage(data.message);

      const loadedVersions = await loadHistory();

      if (data.resumeId) {
        const matchingVersion = loadedVersions.find(
          (item) => item.resumeId === data.resumeId
        );

        if (matchingVersion) {
          setSelectedVersion(matchingVersion);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the resume."
      );
    } finally {
      setUploading(false);
      // Allow selecting the same file again.
      event.target.value = "";
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getScore(version: ResumeVersion): number | null {
    const atsScore = version.analysis?.ats?.score;

    if (typeof atsScore === "number") {
      return atsScore;
    }

    if (version.scores) {
      const possibleKeys = [
        "overall",
        "overallScore",
        "ats",
        "atsScore",
        "resumeScore",
      ];

      for (const key of possibleKeys) {
        const value = version.scores[key];

        if (typeof value === "number") {
          return value;
        }
      }
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="aurora-gradient flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg shadow-indigo-500/20">
                <FileText className="h-5 w-5 text-white" />
              </div>

              <span className="text-sm font-medium text-indigo-300">
                Resume Intelligence
              </span>
            </div>

            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Your resume versions
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Upload your resume, analyze it with AI, and keep every
              meaningful version in your career workspace.
            </p>
          </div>

          {/* Upload */}
          <label
            className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 ${
              uploading
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Resume
              </>
            )}

            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-200">
                {message}
              </p>

              {message.toLowerCase().includes("reused") && (
                <p className="mt-1 text-xs text-emerald-300/70">
                  No new AI analysis was required for this identical resume
                  version.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Version history */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Resume Version History
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Every changed resume is stored separately.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
              {versions.length}{" "}
              {versions.length === 1 ? "version" : "versions"}
            </div>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-16">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : versions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-600" />

              <h3 className="mt-4 text-base font-semibold text-slate-300">
                No resumes yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Upload your first resume to create your first AI-powered
                resume version.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {[...versions].reverse().map((version) => {
                const isSelected =
                  selectedVersion?.resumeId === version.resumeId;
                const score = getScore(version);

                return (
                  <button
                    key={version.resumeId}
                    type="button"
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-indigo-400/40 bg-indigo-500/[0.08]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-white/[0.05] text-slate-400"
                          }`}
                        >
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-indigo-500/15 px-2 py-1 text-[11px] font-semibold text-indigo-300">
                              V{version.version}
                            </span>

                            {version.analysisId && (
                              <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300">
                                AI analyzed
                              </span>
                            )}
                          </div>

                          <p className="mt-2 truncate text-sm font-medium text-slate-200">
                            {version.fileName}
                          </p>

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock3 className="h-3 w-3" />
                            {formatDate(version.createdAt)}
                          </p>
                        </div>
                      </div>

                      {score !== null && (
                        <div className="shrink-0 text-left md:text-right">
                          <p className="text-[11px] uppercase tracking-wider text-slate-500">
                            ATS Score
                          </p>
                          <p className="mt-1 text-xl font-semibold text-white">
                            {Math.round(score)}
                            <span className="text-sm text-slate-500">
                              /100
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected version */}
        {selectedVersion?.analysis && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                    AI Analysis
                  </span>
                </div>

                <h2 className="mt-2 text-xl font-semibold">
                  V{selectedVersion.version} · {selectedVersion.fileName}
                </h2>
              </div>

              {getScore(selectedVersion) !== null && (
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.08] px-5 py-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    ATS Score
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {Math.round(getScore(selectedVersion) as number)}
                    <span className="text-sm text-slate-500">/100</span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-6 pt-6 lg:grid-cols-2">
              {/* Candidate */}
              <div className="rounded-xl border border-white/10 bg-black/10 p-5">
                <h3 className="text-sm font-semibold text-white">
                  Candidate Profile
                </h3>

                {selectedVersion.analysis.candidateProfile
                  ?.professionalSummary && (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {
                      selectedVersion.analysis.candidateProfile
                        .professionalSummary
                    }
                  </p>
                )}

                {selectedVersion.analysis.candidateProfile
                  ?.experienceLevel && (
                  <p className="mt-4 text-xs text-slate-500">
                    Experience level:{" "}
                    <span className="text-slate-300">
                      {
                        selectedVersion.analysis.candidateProfile
                          .experienceLevel
                      }
                    </span>
                  </p>
                )}
              </div>

              {/* Target roles */}
              <div className="rounded-xl border border-white/10 bg-black/10 p-5">
                <h3 className="text-sm font-semibold text-white">
                  Target Roles
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    selectedVersion.analysis.candidateProfile?.targetRoles ??
                    []
                  ).map((role) => (
                    <span
                      key={role}
                      className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-slate-300"
                    >
                      {role}
                    </span>
                  ))}

                  {!selectedVersion.analysis.candidateProfile?.targetRoles
                    ?.length && (
                    <span className="text-sm text-slate-500">
                      No target roles identified.
                    </span>
                  )}
                </div>
              </div>

              {/* Technical skills */}
              <div className="rounded-xl border border-white/10 bg-black/10 p-5">
                <h3 className="text-sm font-semibold text-white">
                  Technical Skills
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    selectedVersion.analysis.skills?.technical ?? []
                  ).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200"
                    >
                      {skill}
                    </span>
                  ))}

                  {!selectedVersion.analysis.skills?.technical?.length && (
                    <span className="text-sm text-slate-500">
                      No technical skills identified.
                    </span>
                  )}
                </div>
              </div>

              {/* ATS strengths */}
              <div className="rounded-xl border border-white/10 bg-black/10 p-5">
                <h3 className="text-sm font-semibold text-white">
                  ATS Strengths
                </h3>

                <ul className="mt-3 space-y-2">
                  {(selectedVersion.analysis.ats?.strengths ?? [])
                    .slice(0, 5)
                    .map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm leading-5 text-slate-400"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        {item}
                      </li>
                    ))}

                  {!selectedVersion.analysis.ats?.strengths?.length && (
                    <li className="text-sm text-slate-500">
                      No strengths identified.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
