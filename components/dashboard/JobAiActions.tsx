"use client";

import { useRef, useState } from "react";
import {
  BrainCircuit,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

type JobAiActionsProps = {
  company: string;
  position: string;
  jobDescription: string;
};

type JobMatchResult = {
  jobProfile: {
    jobTitle: string;
    company: string;
    seniorityLevel: string;
    summary: string;
  };
  requirements: {
    requiredSkills: string[];
    preferredSkills: string[];
    qualifications: string[];
    experienceRequirements: string[];
  };
  match: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchingKeywords: string[];
    missingKeywords: string[];
    experienceAlignment: string;
    strengths: string[];
    recommendations: string[];
  };
};

export function JobAiActions({
  company,
  position,
  jobDescription,
}: JobAiActionsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "match" | "cover-letter" | "interview"
  >("match");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const [matchResult, setMatchResult] =
    useState<JobMatchResult | null>(null);

  function openAction(
    action: "match" | "cover-letter" | "interview"
  ) {
    setSelectedAction(action);
    setError("");
    setMatchResult(null);
    setResumeFile(null);
    setIsOpen(true);
  }

  function closeModal() {
    if (isAnalyzing) {
      return;
    }

    setIsOpen(false);
    setError("");
    setMatchResult(null);
    setResumeFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleResumeChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a PDF or DOCX resume.");
      setResumeFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be smaller than 5 MB.");
      setResumeFile(null);
      return;
    }

    setError("");
    setResumeFile(file);
  }

  async function analyzeMatch() {
    if (!resumeFile) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "This job does not have a job description yet. Edit the job and add one first."
      );
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setMatchResult(null);

    try {
      const formData = new FormData();

      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/job-match", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        match?: JobMatchResult;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data.success || !data.match) {
        throw new Error(
          data.message || "Job matching failed."
        );
      }

      setMatchResult(data.match);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while analyzing the job."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  const actionTitle =
    selectedAction === "match"
      ? "Analyze Resume Match"
      : selectedAction === "cover-letter"
        ? "Generate Cover Letter"
        : "Interview Coach";

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openAction("match")}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300 transition hover:bg-indigo-500/20"
        >
          <BrainCircuit className="h-3.5 w-3.5" />
          Analyze Match
        </button>

        <button
          type="button"
          onClick={() => openAction("cover-letter")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
        >
          <FileText className="h-3.5 w-3.5" />
          Cover Letter
        </button>

        <button
          type="button"
          onClick={() => openAction("interview")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
        >
          <BrainCircuit className="h-3.5 w-3.5" />
          Interview Coach
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1120] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-400">
                  {company}
                </p>

                <h2 className="mt-1 text-lg font-semibold text-white">
                  {actionTitle}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {position}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {!matchResult && (
                <>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                        <Upload className="h-4 w-4 text-indigo-400" />
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-slate-200">
                          Upload your resume
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          PDF or DOCX, maximum 5 MB.
                        </p>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleResumeChange}
                      className="mt-5 block w-full cursor-pointer rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:text-xs file:text-indigo-300"
                    />

                    {resumeFile && (
                      <p className="mt-3 text-xs text-emerald-400">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>

                  {selectedAction !== "match" && (
                    <div className="rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
                      <p className="text-xs leading-5 text-amber-200/80">
                        This action is connected to the real ElevAI
                        workflow, but we are wiring its API action next.
                        No fake result will be shown.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                      <p className="text-sm text-red-300">
                        {error}
                      </p>
                    </div>
                  )}

                  {selectedAction === "match" && (
                    <button
                      type="button"
                      onClick={analyzeMatch}
                      disabled={isAnalyzing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="h-4 w-4" />
                          Analyze Match
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {matchResult && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-6 text-center">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Resume Match Score
                    </p>

                    <p className="mt-2 text-5xl font-semibold text-white">
                      {matchResult.match.score}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      out of 100
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                      <h3 className="text-sm font-medium text-slate-200">
                        Matched Skills
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {matchResult.match.matchedSkills.length > 0 ? (
                          matchResult.match.matchedSkills.map(
                            (skill) => (
                              <span
                                key={skill}
                                className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300"
                              >
                                {skill}
                              </span>
                            )
                          )
                        ) : (
                          <p className="text-xs text-slate-500">
                            No matched skills identified.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                      <h3 className="text-sm font-medium text-slate-200">
                        Missing Skills
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {matchResult.match.missingSkills.length > 0 ? (
                          matchResult.match.missingSkills.map(
                            (skill) => (
                              <span
                                key={skill}
                                className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-xs text-red-300"
                              >
                                {skill}
                              </span>
                            )
                          )
                        ) : (
                          <p className="text-xs text-slate-500">
                            No missing skills identified.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <h3 className="text-sm font-medium text-slate-200">
                      Experience Alignment
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {matchResult.match.experienceAlignment}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <h3 className="text-sm font-medium text-slate-200">
                      Recommendations
                    </h3>

                    <ul className="mt-3 space-y-3">
                      {matchResult.match.recommendations.map(
                        (recommendation) => (
                          <li
                            key={recommendation}
                            className="text-sm leading-6 text-slate-400"
                          >
                            • {recommendation}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMatchResult(null);
                      setResumeFile(null);
                    }}
                    className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Analyze Another Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}