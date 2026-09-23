"use client";

import { useRef, useState } from "react";
import {
  BriefcaseBusiness,
  FileText,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { PageBackLink } from "@/components/dashboard/PageBackLink";

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

export default function JobTrackerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [jobDescription, setJobDescription] =
    useState("");

  const [result, setResult] =
    useState<JobMatchResult | null>(null);

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
    setResult(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description first.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("resume", selectedFile);
      formData.append(
        "jobDescription",
        jobDescription
      );

      const response = await fetch(
        "/api/job-match",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Job match analysis failed."
        );
      }

      if (!data.match) {
        throw new Error(
          "No job match analysis was returned."
        );
      }

      setResult(data.match);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while analyzing the job match."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <PageBackLink />
        {/* Header */}
        <div>
          <p className="text-sm text-indigo-400">
            Career intelligence
          </p>

          <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight">
            Job Match
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Compare your resume with a specific job
            description and discover where your experience
            aligns and where you may have gaps.
          </p>
        </div>

        {/* Input workspace */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Resume */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-indigo-400" />

              <h2 className="font-heading text-lg font-semibold">
                Your Resume
              </h2>
            </div>

            {!selectedFile ? (
              <button
                type="button"
                onClick={handleChooseFile}
                className="mx-auto mt-6 flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center transition hover:border-indigo-400/40 hover:bg-white/[0.04]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Upload className="h-5 w-5 text-indigo-400" />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-200">
                  Upload resume
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  PDF or DOCX • Maximum 5 MB
                </p>
              </button>
            ) : (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
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
          </div>

          {/* Job description */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-indigo-400" />

              <h2 className="font-heading text-lg font-semibold">
                Job Description
              </h2>
            </div>

            <textarea
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(event.target.value)
              }
              placeholder="Paste the complete job description here..."
              className="mt-6 min-h-[220px] w-full resize-y rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
            />

            <p className="mt-2 text-xs text-slate-500">
              Include responsibilities, requirements,
              skills, qualifications, and other details
              from the job posting when available.
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Analyze button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />

            {isAnalyzing
              ? "Analyzing..."
              : "Analyze Job Match"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <section className="mt-10 space-y-6">
            {/* Match score */}
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-indigo-400">
                    Job Match
                  </p>

                  <h2 className="font-heading mt-2 text-2xl font-bold">
                    {result.jobProfile.jobTitle}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {result.jobProfile.company ||
                      "Company not specified"}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-sm text-slate-500">
                    Match Score
                  </p>

                  <p className="mt-1 text-4xl font-bold text-indigo-400">
                    {result.match.score}%
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-300">
                {result.jobProfile.summary}
              </p>
            </div>

            {/* Experience */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold">
                Experience Alignment
              </h3>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {result.match.experienceAlignment}
              </p>
            </div>

            {/* Skills */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold">
                  Matched Skills
                </h3>

                <div className="mt-5 flex flex-wrap gap-2">
                  {result.match.matchedSkills.length > 0 ? (
                    result.match.matchedSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-emerald-400/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No matching skills identified.
                    </p>
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold">
                  Missing Skills
                </h3>

                <div className="mt-5 flex flex-wrap gap-2">
                  {result.match.missingSkills.length > 0 ? (
                    result.match.missingSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-amber-400/20 bg-amber-500/5 px-3 py-1.5 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No significant missing skills identified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold">
                  Matching Keywords
                </h3>

                <div className="mt-5 space-y-3">
                  {result.match.matchingKeywords.length > 0 ? (
                    result.match.matchingKeywords.map(
                      (keyword) => (
                        <div
                          key={keyword}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                        >
                          {keyword}
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No significant keyword overlap identified.
                    </p>
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold">
                  Missing Keywords
                </h3>

                <div className="mt-5 space-y-3">
                  {result.match.missingKeywords.length > 0 ? (
                    result.match.missingKeywords.map(
                      (keyword) => (
                        <div
                          key={keyword}
                          className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                        >
                          {keyword}
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      No major missing keywords identified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold">
                Match Strengths
              </h3>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {result.match.strengths.length > 0 ? (
                  result.match.strengths.map(
                    (strength) => (
                      <div
                        key={strength}
                        className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-300"
                      >
                        {strength}
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-500">
                    No specific strengths identified.
                  </p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold">
                Recommendations
              </h3>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {result.match.recommendations.length > 0 ? (
                  result.match.recommendations.map(
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
                    No additional recommendations available.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}