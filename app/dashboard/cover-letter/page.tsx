"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  FileText,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { PageBackLink } from "@/components/dashboard/PageBackLink";

type Tone = "professional" | "confident" | "friendly";

type CoverLetterResult = {
  candidateProfile: {
    candidateName: string;
    currentPositioning: string;
    relevantSkills: string[];
    relevantExperience: string[];
  };

  jobProfile: {
    jobTitle: string;
    company: string;
    keyRequirements: string[];
  };

  coverLetter: {
    subject: string;
    greeting: string;
    opening: string;
    body: string[];
    closing: string;
    fullText: string;
  };

  personalization: {
    matchedRequirements: string[];
    personalizationPoints: string[];
  };
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  result?: CoverLetterResult;
};

export default function CoverLetterPage() {
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] =
    useState("");

  const [tone, setTone] =
    useState<Tone>("professional");

  const [result, setResult] =
    useState<CoverLetterResult | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [error, setError] = useState("");

  const [copied, setCopied] =
    useState(false);

  // ----------------------------------------
  // Resume upload
  // ----------------------------------------

  function handleResumeChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isPdf =
      file.type === "application/pdf";

    const isDocx =
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isPdf && !isDocx) {
      setError(
        "Please upload a PDF or DOCX resume."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Resume must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setResume(file);
    setResult(null);
    setError("");
    setCopied(false);
  }

  // ----------------------------------------
  // Remove resume
  // ----------------------------------------

  function removeResume() {
    setResume(null);
    setResult(null);
    setError("");
    setCopied(false);
  }

  // ----------------------------------------
  // Generate cover letter
  // ----------------------------------------

  async function handleGenerate() {
    if (!resume) {
      setError(
        "Please upload your resume."
      );
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "Please paste the job description."
      );
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError(
        "Please provide a more complete job description."
      );
      return;
    }

    setIsGenerating(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const formData = new FormData();

      formData.append("resume", resume);
      formData.append(
        "jobDescription",
        jobDescription
      );
      formData.append("tone", tone);

      const response = await fetch(
        "/api/cover-letter",
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText =
        await response.text();

      let data: ApiResponse;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The Cover Letter API returned an invalid response. Check the terminal for the server error."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to generate the cover letter."
        );
      }

      if (!data.result) {
        throw new Error(
          "The API did not return a cover letter."
        );
      }

      setResult(data.result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the cover letter."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  // ----------------------------------------
  // Copy cover letter
  // ----------------------------------------

  async function handleCopy() {
    if (!result?.coverLetter.fullText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        result.coverLetter.fullText
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Unable to copy the cover letter."
      );
    }
  }

  // ----------------------------------------
  // Reset
  // ----------------------------------------

  function handleReset() {
    setResume(null);
    setJobDescription("");
    setTone("professional");
    setResult(null);
    setError("");
    setCopied(false);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PageBackLink />

        {/* Header */}
        <div className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-indigo-400">
                AI Career Tool
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Cover Letter Generator
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Create a tailored cover letter using
                your actual resume and the
                requirements of the job.
              </p>
            </div>
          </div>
        </div>

        {/* INPUT VIEW */}
        {!result && (
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Resume */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-400" />

                <div>
                  <h2 className="font-medium text-white">
                    Your Resume
                  </h2>

                  <p className="text-xs text-slate-500">
                    PDF or DOCX • Maximum 5 MB
                  </p>
                </div>
              </div>

              {!resume ? (
                <label className="mx-auto mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center transition hover:border-indigo-400/40 hover:bg-white/[0.04]">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleResumeChange}
                    className="hidden"
                  />

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Upload className="h-5 w-5 text-indigo-400" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-200">
                    Upload your resume
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Click to choose a PDF or DOCX file
                  </p>
                </label>
              ) : (
                <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                      <FileText className="h-5 w-5 text-indigo-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {resume.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {(
                          resume.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeResume}
                    className="ml-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                    aria-label="Remove resume"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Job Description */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div>
                <h2 className="font-medium text-white">
                  Job Description
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Paste the job description you are
                  applying for.
                </p>
              </div>

              <textarea
                value={jobDescription}
                onChange={(event) =>
                  setJobDescription(
                    event.target.value
                  )
                }
                placeholder="Paste the complete job description here..."
                rows={10}
                className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
              />
            </section>

            {/* Tone */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
              <div>
                <h2 className="font-medium text-white">
                  Choose your tone
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  ElevAI will adapt the writing style
                  while keeping your actual
                  experience intact.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    [
                      "professional",
                      "Professional",
                      "Clear and polished",
                    ],
                    [
                      "confident",
                      "Confident",
                      "Strong and direct",
                    ],
                    [
                      "friendly",
                      "Friendly",
                      "Warm and approachable",
                    ],
                  ] as const
                ).map(
                  ([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setTone(value)
                      }
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        tone === value
                          ? "border-indigo-400/50 bg-indigo-500/10 text-white"
                          : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                    >
                      <span className="font-medium">
                        {label}
                      </span>

                      <span className="mt-1 block text-xs text-slate-500">
                        {description}
                      </span>
                    </button>
                  )
                )}
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mx-auto mt-6 flex w-fit min-w-[210px] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />

                {isGenerating
                  ? "Generating..."
                  : "Generate Cover Letter"}
              </button>
            </section>
          </div>
        )}

        {/* RESULT VIEW */}
        {result && (
          <div className="mt-10 space-y-6">
            {/* Cover Letter */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-indigo-400">
                    Generated Cover Letter
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {result.jobProfile.jobTitle}
                  </h2>

                  {result.jobProfile.company && (
                    <p className="mt-1 text-sm text-slate-400">
                      {result.jobProfile.company}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Subject */}
              {result.coverLetter.subject && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Subject
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-200">
                    {result.coverLetter.subject}
                  </p>
                </div>
              )}

              {/* Letter */}
              <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-6">
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {result.coverLetter.fullText}
                </div>
              </div>
            </section>

            {/* Personalization */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-medium text-white">
                  Matched Requirements
                </h3>

                {result.personalization
                  .matchedRequirements.length >
                0 ? (
                  <div className="mt-4 space-y-2">
                    {result.personalization.matchedRequirements.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No specific matched
                    requirements were identified.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-medium text-white">
                  Personalization Points
                </h3>

                {result.personalization
                  .personalizationPoints.length >
                0 ? (
                  <div className="mt-4 space-y-2">
                    {result.personalization.personalizationPoints.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No additional personalization
                    points were identified.
                  </p>
                )}
              </section>
            </div>

            {/* Candidate Profile */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-medium text-white">
                Candidate Profile Used
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {result.candidateProfile.currentPositioning}
              </p>

              {result.candidateProfile.relevantSkills
                .length > 0 && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Relevant Skills
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.candidateProfile.relevantSkills.map(
                      (skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-5 py-3 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />

                {isGenerating
                  ? "Generating..."
                  : "Regenerate"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />

                Start Over
              </button>
            </div>

            {error && (
              <div className="mx-auto max-w-2xl rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm leading-6 text-red-300">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}