"use client";

import { useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  FileText,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { PageBackLink } from "@/components/dashboard/PageBackLink";

type InterviewCoachResult = {
  interviewProfile: {
    role: string;
    company: string;
    experienceLevel: string;
    candidatePositioning: string;
  };

  preparationSummary: {
    strengthsToEmphasize: string[];
    areasToPrepare: string[];
    preparationPriorities: string[];
  };

  technicalQuestions: {
    question: string;
    whyItMayBeAsked: string;
    whatToCover: string[];
    difficulty: "basic" | "intermediate" | "advanced";
  }[];

  behavioralQuestions: {
    question: string;
    whyItMayBeAsked: string;
    whatToCover: string[];
  }[];

  resumeQuestions: {
    question: string;
    resumeEvidence: string;
    preparationGuidance: string;
  }[];

  jobSpecificQuestions: {
    question: string;
    relatedRequirement: string;
    whatToCover: string[];
  }[];

  answerGuidance: {
    question: string;
    structure: string;
    keyPoints: string[];
  }[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  result?: InterviewCoachResult;
};

export default function InterviewPage() {
  const [resume, setResume] =
    useState<File | null>(null);

  const [jobDescription, setJobDescription] =
    useState("");

  const [result, setResult] =
    useState<InterviewCoachResult | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [error, setError] = useState("");

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
  }

  function removeResume() {
    setResume(null);
    setResult(null);
    setError("");
  }

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

    try {
      const formData = new FormData();

      formData.append("resume", resume);
      formData.append(
        "jobDescription",
        jobDescription
      );

      const response = await fetch(
        "/api/interview-coach",
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
          "The Interview Coach API returned an invalid response. Check the terminal for the server error."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to generate interview preparation."
        );
      }

      if (!data.result) {
        throw new Error(
          "The API did not return interview preparation."
        );
      }

      setResult(data.result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while preparing the interview."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleReset() {
    setResume(null);
    setJobDescription("");
    setResult(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PageBackLink />

        {/* Header */}

        <div className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
              <BrainCircuit className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-indigo-400">
                AI Career Tool
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Interview Coach
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Prepare for interviews using your
                actual resume and the specific job
                requirements.
              </p>
            </div>
          </div>
        </div>

        {/* INPUT */}

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
                    Click to choose a PDF or DOCX
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
              <h2 className="font-medium text-white">
                Job Description
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Paste the job description for the
                interview you are preparing for.
              </p>

              <textarea
                value={jobDescription}
                onChange={(event) =>
                  setJobDescription(
                    event.target.value
                  )
                }
                placeholder="Paste the complete job description here..."
                rows={12}
                className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
              />
            </section>

            {/* Generate */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
              {error && (
                <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mx-auto flex w-fit min-w-[220px] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />

                {isGenerating
                  ? "Preparing..."
                  : "Prepare for Interview"}
              </button>
            </section>
          </div>
        )}

        {/* RESULTS */}

        {result && (
          <div className="mt-10 space-y-6">
            {/* Profile */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-wider text-indigo-400">
                Interview Profile
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                {result.interviewProfile.role}
              </h2>

              {result.interviewProfile.company && (
                <p className="mt-1 text-sm text-slate-400">
                  {result.interviewProfile.company}
                </p>
              )}

              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">
                {
                  result.interviewProfile
                    .candidatePositioning
                }
              </p>
            </section>

            {/* Preparation Summary */}

            <div className="grid gap-6 lg:grid-cols-3">
              <SummaryCard
                title="Strengths to Emphasize"
                items={
                  result.preparationSummary
                    .strengthsToEmphasize
                }
              />

              <SummaryCard
                title="Areas to Prepare"
                items={
                  result.preparationSummary
                    .areasToPrepare
                }
              />

              <SummaryCard
                title="Preparation Priorities"
                items={
                  result.preparationSummary
                    .preparationPriorities
                }
              />
            </div>

            {/* Technical Questions */}

            <QuestionSection
              title="Technical Questions"
              description="Technical topics connected to the role and its requirements."
            >
              {result.technicalQuestions.map(
                (item, index) => (
                  <QuestionCard
                    key={index}
                    question={item.question}
                    why={item.whyItMayBeAsked}
                    items={item.whatToCover}
                    badge={item.difficulty}
                  />
                )
              )}
            </QuestionSection>

            {/* Behavioral Questions */}

            <QuestionSection
              title="Behavioral Questions"
              description="Questions that may explore communication, collaboration and problem-solving."
            >
              {result.behavioralQuestions.map(
                (item, index) => (
                  <QuestionCard
                    key={index}
                    question={item.question}
                    why={item.whyItMayBeAsked}
                    items={item.whatToCover}
                  />
                )
              )}
            </QuestionSection>

            {/* Resume Questions */}

            <QuestionSection
              title="Resume-Based Questions"
              description="Questions generated from actual information in your resume."
            >
              {result.resumeQuestions.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                  >
                    <p className="font-medium text-slate-200">
                      {item.question}
                    </p>

                    <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
                      Resume Evidence
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.resumeEvidence}
                    </p>

                    <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
                      Preparation Guidance
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.preparationGuidance}
                    </p>
                  </div>
                )
              )}
            </QuestionSection>

            {/* Job Specific */}

            <QuestionSection
              title="Job-Specific Questions"
              description="Questions connected directly to the requirements in the job description."
            >
              {result.jobSpecificQuestions.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                  >
                    <p className="font-medium text-slate-200">
                      {item.question}
                    </p>

                    <p className="mt-3 text-sm text-indigo-300">
                      Requirement:{" "}
                      {item.relatedRequirement}
                    </p>

                    <ul className="mt-4 space-y-2">
                      {item.whatToCover.map(
                        (point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="text-sm leading-6 text-slate-400"
                          >
                            • {point}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )
              )}
            </QuestionSection>

            {/* Answer Guidance */}

            <QuestionSection
              title="Answer Guidance"
              description="Practical structures for preparing strong, evidence-based answers."
            >
              {result.answerGuidance.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                  >
                    <p className="font-medium text-slate-200">
                      {item.question}
                    </p>

                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      <span className="text-slate-300">
                        Structure:
                      </span>{" "}
                      {item.structure}
                    </p>

                    <ul className="mt-4 space-y-2">
                      {item.keyPoints.map(
                        (point, pointIndex) => (
                          <li
                            key={pointIndex}
                            className="text-sm leading-6 text-slate-400"
                          >
                            • {point}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )
              )}
            </QuestionSection>

            {/* Actions */}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-medium text-white">
        {title}
      </h3>

      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="text-sm leading-6 text-slate-400"
          >
            • {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuestionSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>

      <div className="mt-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

function QuestionCard({
  question,
  why,
  items,
  badge,
}: {
  question: string;
  why: string;
  items: string[];
  badge?: string;
}) {
  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <div>
          <p className="font-medium text-slate-200">
            {question}
          </p>

          {badge && (
            <span className="mt-2 inline-block rounded-full border border-white/10 px-2.5 py-1 text-[11px] capitalize text-slate-500">
              {badge}
            </span>
          )}
        </div>

        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-white/10 px-5 pb-5 pt-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Why it may be asked
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {why}
        </p>

        <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
          What to prepare
        </p>

        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="text-sm leading-6 text-slate-400"
            >
              • {item}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}