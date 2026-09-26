"use client";

import { useRef, useState } from "react";
import {
  BrainCircuit,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { downloadInterviewPreparationPDF } from "@/lib/pdf/interview-preparation-pdf";

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

type CoverLetterResult = {
  coverLetter?: string;
  subject?: string;
  [key: string]: unknown;
};

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

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  const [matchResult, setMatchResult] =
    useState<JobMatchResult | null>(null);

  const [coverLetterResult, setCoverLetterResult] =
    useState<CoverLetterResult | null>(null);

  const [interviewResult, setInterviewResult] =
    useState<InterviewCoachResult | null>(null);

  const [tone, setTone] = useState<
    "professional" | "confident" | "friendly"
  >("professional");

  function openAction(
    action: "match" | "cover-letter" | "interview"
  ) {
    setSelectedAction(action);
    setError("");
    setMatchResult(null);
    setCoverLetterResult(null);
    setInterviewResult(null);
    setResumeFile(null);
    setIsOpen(true);
  }

  function closeModal() {
    if (isLoading) {
      return;
    }

    setIsOpen(false);
    setError("");
    setMatchResult(null);
    setCoverLetterResult(null);
    setInterviewResult(null);
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
        "This job does not have a job description yet."
      );
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  async function generateCoverLetter() {
    if (!resumeFile) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "This job does not have a job description yet."
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setCoverLetterResult(null);

    try {
      const formData = new FormData();

      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);
      formData.append("tone", tone);

      const response = await fetch("/api/cover-letter", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        result?: CoverLetterResult;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data.success || !data.result) {
        throw new Error(
          data.message ||
            "Cover letter generation failed."
        );
      }

      setCoverLetterResult(data.result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the cover letter."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function generateInterviewCoach() {
    if (!resumeFile) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "This job does not have a job description yet."
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setInterviewResult(null);

    try {
      const formData = new FormData();

      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/interview-coach", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        result?: InterviewCoachResult;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data.success || !data.result) {
        throw new Error(
          data.message ||
            "Interview preparation failed."
        );
      }

      setInterviewResult(data.result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while preparing the interview."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function getCoverLetterText() {
    if (!coverLetterResult) {
      return "";
    }

    if (typeof coverLetterResult.coverLetter === "string") {
      return coverLetterResult.coverLetter;
    }

    return Object.values(coverLetterResult)
      .filter((value) => typeof value === "string")
      .join("\n\n");
  }

  async function copyCoverLetter() {
    const text = getCoverLetterText();

    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
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
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1120] shadow-2xl">

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
                disabled={isLoading}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">

              {/* ================= MATCH RESULT ================= */}

              {selectedAction === "match" &&
                matchResult && (
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

              {/* ================= COVER LETTER RESULT ================= */}

              {selectedAction === "cover-letter" &&
                coverLetterResult && (
                  <div className="space-y-5">

                    {coverLetterResult.subject && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          Subject
                        </p>

                        <p className="mt-2 text-sm text-white">
                          {coverLetterResult.subject}
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-medium text-slate-200">
                          Generated Cover Letter
                        </h3>

                        <button
                          type="button"
                          onClick={copyCoverLetter}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          Copy
                        </button>
                      </div>

                      <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {getCoverLetterText()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCoverLetterResult(null);
                        setResumeFile(null);
                      }}
                      className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      Generate Another
                    </button>
                  </div>
                )}

              {/* ================= INTERVIEW RESULT ================= */}

             {/* ================= INTERVIEW RESULT ================= */}

{selectedAction === "interview" &&
  interviewResult && (
    <div className="space-y-6">

      {/* Download Interview PDF */}

      <div className="flex items-center justify-between rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
        <div>
          <p className="text-sm font-medium text-white">
            Interview Preparation Ready
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Download your complete interview preparation as a PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            downloadInterviewPreparationPDF(interviewResult)
          }
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          <FileText className="h-4 w-4" />
          Download PDF
        </button>
      </div>
                    {/* Profile */}

                    <section className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-6">
                      <p className="text-xs uppercase tracking-wider text-indigo-400">
                        Interview Profile
                      </p>

                      <h3 className="mt-2 text-xl font-semibold text-white">
                        {interviewResult.interviewProfile.role}
                      </h3>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-500">
                            Company
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {interviewResult.interviewProfile.company}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Experience Level
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {interviewResult.interviewProfile.experienceLevel}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Candidate Positioning
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {interviewResult.interviewProfile.candidatePositioning}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Preparation Summary */}

                    <section className="grid gap-5 md:grid-cols-3">

                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                        <h3 className="text-sm font-medium text-slate-200">
                          Strengths to Emphasize
                        </h3>

                        <ul className="mt-4 space-y-2">
                          {interviewResult.preparationSummary.strengthsToEmphasize.map(
                            (item) => (
                              <li
                                key={item}
                                className="text-sm leading-6 text-slate-400"
                              >
                                • {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                        <h3 className="text-sm font-medium text-slate-200">
                          Areas to Prepare
                        </h3>

                        <ul className="mt-4 space-y-2">
                          {interviewResult.preparationSummary.areasToPrepare.map(
                            (item) => (
                              <li
                                key={item}
                                className="text-sm leading-6 text-slate-400"
                              >
                                • {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                        <h3 className="text-sm font-medium text-slate-200">
                          Preparation Priorities
                        </h3>

                        <ul className="mt-4 space-y-2">
                          {interviewResult.preparationSummary.preparationPriorities.map(
                            (item) => (
                              <li
                                key={item}
                                className="text-sm leading-6 text-slate-400"
                              >
                                • {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                    </section>

                    {/* Technical Questions */}

                    <section>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Technical Questions
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Topics to prepare based on the resume and job description.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {interviewResult.technicalQuestions.map(
                          (item, index) => (
                            <div
                              key={`${item.question}-${index}`}
                              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <h4 className="text-sm font-medium leading-6 text-white">
                                  {index + 1}. {item.question}
                                </h4>

                                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] capitalize text-slate-400">
                                  {item.difficulty}
                                </span>
                              </div>

                              <p className="mt-3 text-sm leading-6 text-slate-400">
                                <span className="text-slate-300">
                                  Why:
                                </span>{" "}
                                {item.whyItMayBeAsked}
                              </p>

                              <div className="mt-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                  What to cover
                                </p>

                                <ul className="mt-2 space-y-2">
                                  {item.whatToCover.map(
                                    (point) => (
                                      <li
                                        key={point}
                                        className="text-sm leading-6 text-slate-400"
                                      >
                                        • {point}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </section>

                    {/* Behavioral Questions */}

                    <section>
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Behavioral Questions
                      </h3>

                      <div className="space-y-4">
                        {interviewResult.behavioralQuestions.map(
                          (item, index) => (
                            <div
                              key={`${item.question}-${index}`}
                              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                            >
                              <h4 className="text-sm font-medium leading-6 text-white">
                                {index + 1}. {item.question}
                              </h4>

                              <p className="mt-3 text-sm leading-6 text-slate-400">
                                <span className="text-slate-300">
                                  Why:
                                </span>{" "}
                                {item.whyItMayBeAsked}
                              </p>

                              <ul className="mt-3 space-y-2">
                                {item.whatToCover.map(
                                  (point) => (
                                    <li
                                      key={point}
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
                      </div>
                    </section>

                    {/* Resume Questions */}

                    <section>
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Resume Questions
                      </h3>

                      <div className="space-y-4">
                        {interviewResult.resumeQuestions.map(
                          (item, index) => (
                            <div
                              key={`${item.question}-${index}`}
                              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                            >
                              <h4 className="text-sm font-medium leading-6 text-white">
                                {index + 1}. {item.question}
                              </h4>

                              <div className="mt-4 space-y-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Resume evidence
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-slate-400">
                                    {item.resumeEvidence}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Preparation guidance
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-slate-400">
                                    {item.preparationGuidance}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </section>

                    {/* Job Specific Questions */}

                    <section>
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Job-Specific Questions
                      </h3>

                      <div className="space-y-4">
                        {interviewResult.jobSpecificQuestions.map(
                          (item, index) => (
                            <div
                              key={`${item.question}-${index}`}
                              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                            >
                              <h4 className="text-sm font-medium leading-6 text-white">
                                {index + 1}. {item.question}
                              </h4>

                              <p className="mt-3 text-sm leading-6 text-slate-400">
                                <span className="text-slate-300">
                                  Related requirement:
                                </span>{" "}
                                {item.relatedRequirement}
                              </p>

                              <ul className="mt-3 space-y-2">
                                {item.whatToCover.map(
                                  (point) => (
                                    <li
                                      key={point}
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
                      </div>
                    </section>

                    {/* Answer Guidance */}

                    <section>
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Answer Guidance
                      </h3>

                      <div className="space-y-4">
                        {interviewResult.answerGuidance.map(
                          (item, index) => (
                            <div
                              key={`${item.question}-${index}`}
                              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                            >
                              <h4 className="text-sm font-medium leading-6 text-white">
                                {index + 1}. {item.question}
                              </h4>

                              <p className="mt-3 text-sm leading-6 text-slate-400">
                                <span className="text-slate-300">
                                  Structure:
                                </span>{" "}
                                {item.structure}
                              </p>

                              <ul className="mt-3 space-y-2">
                                {item.keyPoints.map(
                                  (point) => (
                                    <li
                                      key={point}
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
                      </div>
                    </section>

                    <button
                      type="button"
                      onClick={() => {
                        setInterviewResult(null);
                        setResumeFile(null);
                      }}
                      className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                    >
                      Prepare Another Interview
                    </button>
                  </div>
                )}

              {/* ================= INPUT ================= */}

              {!matchResult &&
                !coverLetterResult &&
                !interviewResult && (
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

                    {selectedAction === "cover-letter" && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                        <h3 className="text-sm font-medium text-slate-200">
                          Choose tone
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          The AI will adapt the writing style while keeping your actual experience intact.
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">

                          {(
                            [
                              ["professional", "Professional", "Clear and polished"],
                              ["confident", "Confident", "Strong and direct"],
                              ["friendly", "Friendly", "Warm and approachable"],
                            ] as const
                          ).map(
                            ([value, label, description]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setTone(value)}
                                className={`rounded-xl border p-4 text-left transition ${
                                  tone === value
                                    ? "border-indigo-400/40 bg-indigo-500/10"
                                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                                }`}
                              >
                                <p className="text-sm font-medium text-white">
                                  {label}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {description}
                                </p>
                              </button>
                            )
                          )}

                        </div>
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
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
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

                    {selectedAction === "cover-letter" && (
                      <button
                        type="button"
                        onClick={generateCoverLetter}
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Generate Cover Letter
                          </>
                        )}
                      </button>
                    )}

                    {selectedAction === "interview" && (
                      <button
                        type="button"
                        onClick={generateInterviewCoach}
                        disabled={isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Preparing Interview...
                          </>
                        ) : (
                          <>
                            <BrainCircuit className="h-4 w-4" />
                            Prepare Interview
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}