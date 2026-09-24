"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { PageBackLink } from "@/components/dashboard/PageBackLink";
import { JobAiActions } from "@/components/dashboard/JobAiActions";

type JobStatus =
  | "Saved"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

type JobTimelineEvent = {
  id: string;
  status: JobStatus;
  date: string;
  note: string;
};

type JobApplication = {
  id: string;
  company: string;
  position: string;
  jobUrl: string;
  jobDescription: string;
  applicationDate: string;
  status: JobStatus;
  notes: string;
  interviewDate: string;
  timeline: JobTimelineEvent[];
};

type JobForm = {
  company: string;
  position: string;
  jobUrl: string;
  jobDescription: string;
  applicationDate: string;
  status: JobStatus;
  notes: string;
  interviewDate: string;
};

type StatusFilter = "All" | JobStatus;

const STORAGE_KEY = "elevai-job-tracker";

const statusOptions: JobStatus[] = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const filterOptions: StatusFilter[] = [
  "All",
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const emptyForm: JobForm = {
  company: "",
  position: "",
  jobUrl: "",
  jobDescription: "",
  applicationDate: "",
  status: "Saved",
  notes: "",
  interviewDate: "",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function createTimelineEvent(
  status: JobStatus,
  note = ""
): JobTimelineEvent {
  return {
    id: crypto.randomUUID(),
    status,
    date: getToday(),
    note,
  };
}

function getStatusClasses(status: JobStatus) {
  switch (status) {
    case "Applied":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Interview":
      return "border-purple-400/20 bg-purple-400/10 text-purple-300";

    case "Offer":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Rejected":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Withdrawn":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    default:
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
}

function getTimelineDotClasses(status: JobStatus) {
  switch (status) {
    case "Applied":
      return "bg-blue-400";

    case "Interview":
      return "bg-purple-400";

    case "Offer":
      return "bg-emerald-400";

    case "Rejected":
      return "bg-red-400";

    case "Withdrawn":
      return "bg-orange-400";

    default:
      return "bg-slate-400";
  }
}

function formatTimelineDate(date: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeStoredJobs(value: unknown): JobApplication[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((job) => {
    const existingJob = job as Partial<JobApplication>;

    const timeline: JobTimelineEvent[] = Array.isArray(
      existingJob.timeline
    )
      ? existingJob.timeline
          .filter(
            (event): event is JobTimelineEvent =>
              Boolean(
                event &&
                  typeof event === "object" &&
                  "status" in event &&
                  "date" in event
              )
          )
          .map((event) => ({
            id: event.id || crypto.randomUUID(),
            status: event.status,
            date: event.date,
            note: event.note || "",
          }))
      : [
          createTimelineEvent(
            existingJob.status || "Saved",
            "Application imported into the new timeline."
          ),
        ];

    return {
      id: existingJob.id || crypto.randomUUID(),
      company: existingJob.company || "",
      position: existingJob.position || "",
      jobUrl: existingJob.jobUrl || "",
      jobDescription: existingJob.jobDescription || "",
      applicationDate: existingJob.applicationDate || "",
      status: existingJob.status || "Saved",
      notes: existingJob.notes || "",
      interviewDate: existingJob.interviewDate || "",
      timeline,
    };
  });
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [expandedTimeline, setExpandedTimeline] = useState<
    string | null
  >(null);

  useEffect(() => {
    try {
      const storedJobs = localStorage.getItem(STORAGE_KEY);

      if (storedJobs) {
        const parsedJobs = JSON.parse(storedJobs);
        setJobs(normalizeStoredJobs(parsedJobs));
      }
    } catch (error) {
      console.error("Could not load job tracker data:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.error("Could not save job tracker data:", error);
    }
  }, [jobs, isLoaded]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "All" || job.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        job.company.toLowerCase().includes(normalizedSearch) ||
        job.position.toLowerCase().includes(normalizedSearch) ||
        job.notes.toLowerCase().includes(normalizedSearch) ||
        job.jobDescription.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [jobs, searchQuery, statusFilter]);

  const appliedCount = jobs.filter(
    (job) => job.status === "Applied"
  ).length;

  const interviewCount = jobs.filter(
    (job) => job.status === "Interview"
  ).length;

  const offerCount = jobs.filter(
    (job) => job.status === "Offer"
  ).length;

  function openAddModal() {
    setEditingJobId(null);

    setForm({
      ...emptyForm,
      applicationDate: getToday(),
    });

    setIsModalOpen(true);
  }

  function openEditModal(job: JobApplication) {
    setEditingJobId(job.id);

    setForm({
      company: job.company,
      position: job.position,
      jobUrl: job.jobUrl,
      jobDescription: job.jobDescription,
      applicationDate: job.applicationDate,
      status: job.status,
      notes: job.notes,
      interviewDate: job.interviewDate,
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingJobId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const company = form.company.trim();
    const position = form.position.trim();

    if (!company || !position) {
      return;
    }

    if (editingJobId) {
      setJobs((currentJobs) =>
        currentJobs.map((job) => {
          if (job.id !== editingJobId) {
            return job;
          }

          const statusChanged = job.status !== form.status;

          let timeline = job.timeline;

          if (statusChanged) {
            timeline = [
              ...job.timeline,
              createTimelineEvent(
                form.status,
                `Status changed to ${form.status}.`
              ),
            ];
          }

          return {
            ...job,
            company,
            position,
            jobUrl: form.jobUrl.trim(),
            jobDescription: form.jobDescription.trim(),
            applicationDate: form.applicationDate,
            status: form.status,
            notes: form.notes.trim(),
            interviewDate: form.interviewDate,
            timeline,
          };
        })
      );
    } else {
      const initialStatus = form.status;

      const newJob: JobApplication = {
        id: crypto.randomUUID(),
        company,
        position,
        jobUrl: form.jobUrl.trim(),
        jobDescription: form.jobDescription.trim(),
        applicationDate: form.applicationDate,
        status: initialStatus,
        notes: form.notes.trim(),
        interviewDate: form.interviewDate,
        timeline: [
          createTimelineEvent(
            initialStatus,
            "Application created in Job Tracker."
          ),
        ],
      };

      setJobs((currentJobs) => [newJob, ...currentJobs]);
    }

    closeModal();
  }

  function deleteJob(id: string) {
    const shouldDelete = window.confirm(
      "Delete this job from your tracker?"
    );

    if (!shouldDelete) {
      return;
    }

    setJobs((currentJobs) =>
      currentJobs.filter((job) => job.id !== id)
    );

    if (expandedTimeline === id) {
      setExpandedTimeline(null);
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("All");
  }

  function toggleTimeline(id: string) {
    setExpandedTimeline((current) =>
      current === id ? null : id
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageBackLink />

        {/* Header */}
        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                <BriefcaseBusiness className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <p className="text-sm text-indigo-400">
                  Career Management
                </p>

                <h1 className="text-3xl font-semibold tracking-tight">
                  Job Tracker
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Keep track of jobs you save, applications you send,
              interviews you receive, and opportunities you want to
              follow up on.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Jobs
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {jobs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Applied
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {appliedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Interviews
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {interviewCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Offers
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {offerCount}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search company, position, notes or description..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-400/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${
                    statusFilter === filter
                      ? "border-indigo-400/30 bg-indigo-500/15 text-indigo-300"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {(searchQuery || statusFilter !== "All") && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-xs text-slate-500">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-indigo-400 transition hover:text-indigo-300"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Applications */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Applications
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your saved opportunities and applications.
                </p>
              </div>

              {jobs.length > 0 && (
                <p className="text-xs text-slate-500">
                  {filteredJobs.length}{" "}
                  {filteredJobs.length === 1 ? "job" : "jobs"}
                </p>
              )}
            </div>
          </div>

          {!isLoaded ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-slate-500">
                Loading your jobs...
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                <BriefcaseBusiness className="h-6 w-6 text-slate-500" />
              </div>

              <h3 className="mt-5 text-base font-medium text-slate-200">
                No jobs tracked yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Add your first job opportunity to start building your
                career pipeline.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.08]"
              >
                <Plus className="h-4 w-4" />
                Add your first job
              </button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
                <Search className="h-6 w-6 text-slate-500" />
              </div>

              <h3 className="mt-5 text-base font-medium text-slate-200">
                No matching jobs
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another search or change the status filter.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.05]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredJobs.map((job) => {
                const timeline = [...job.timeline].sort((a, b) =>
                  b.date.localeCompare(a.date)
                );

                const isTimelineExpanded =
                  expandedTimeline === job.id;

                return (
                  <article key={job.id} className="px-6 py-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-white">
                            {job.position}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                              job.status
                            )}`}
                          >
                            {job.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {job.company}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          {job.applicationDate && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Applied{" "}
                              {formatTimelineDate(
                                job.applicationDate
                              )}
                            </span>
                          )}

                          {job.interviewDate && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Interview{" "}
                              {formatTimelineDate(
                                job.interviewDate
                              )}
                            </span>
                          )}
                        </div>

                        {job.jobDescription && (
                          <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              Job Description
                            </p>

                            <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-400">
                              {job.jobDescription}
                            </p>
                          </div>
                        )}

                        {job.notes && (
                          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-400">
                            {job.notes}
                          </p>
                        )}

                        {job.jobUrl && (
                          <Link
                            href={job.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 transition hover:text-indigo-300"
                          >
                            View job posting
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}

                              <JobAiActions
                                  company={job.company}
                                    position={job.position}
                                          jobDescription={job.jobDescription}
                                                        />

                        {/* Timeline Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleTimeline(job.id)}
                          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />

                          {isTimelineExpanded
                            ? "Hide timeline"
                            : `View timeline (${timeline.length})`}

                          <ChevronDown
                            className={`h-3.5 w-3.5 transition ${
                              isTimelineExpanded
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        {/* Timeline */}
                        {isTimelineExpanded && (
                          <div className="mt-5 max-w-2xl rounded-xl border border-white/10 bg-black/10 p-5">
                            <div className="mb-4 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-indigo-400" />

                              <h4 className="text-sm font-medium text-slate-200">
                                Application Timeline
                              </h4>
                            </div>

                            {timeline.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                No timeline events yet.
                              </p>
                            ) : (
                              <div className="space-y-0">
                                {timeline.map((event, index) => (
                                  <div
                                    key={event.id}
                                    className="relative flex gap-4"
                                  >
                                    <div className="relative flex w-4 shrink-0 justify-center">
                                      <div
                                        className={`mt-1.5 h-2.5 w-2.5 rounded-full ${getTimelineDotClasses(
                                          event.status
                                        )}`}
                                      />

                                      {index <
                                        timeline.length - 1 && (
                                        <div className="absolute top-4 h-full w-px bg-white/10" />
                                      )}
                                    </div>

                                    <div className="pb-5">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className={`rounded-full border px-2 py-0.5 text-[11px] ${getStatusClasses(
                                            event.status
                                          )}`}
                                        >
                                          {event.status}
                                        </span>

                                        <span className="text-xs text-slate-500">
                                          {formatTimelineDate(
                                            event.date
                                          )}
                                        </span>
                                      </div>

                                      {event.note && (
                                        <p className="mt-2 text-sm leading-5 text-slate-400">
                                          {event.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(job)}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteJob(job.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-400/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-400/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1120] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingJobId ? "Edit Job" : "Add Job"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingJobId
                    ? "Update your application details."
                    : "Save a job opportunity to your tracker."}
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

            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Company *
                  </label>

                  <input
                    required
                    value={form.company}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        company: event.target.value,
                      })
                    }
                    placeholder="e.g. Spotify"
                    className="settings-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Position *
                  </label>

                  <input
                    required
                    value={form.position}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        position: event.target.value,
                      })
                    }
                    placeholder="e.g. Junior Software Developer"
                    className="settings-input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Job URL
                </label>

                <input
                  type="url"
                  value={form.jobUrl}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jobUrl: event.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="settings-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Job Description
                </label>

                <textarea
                  value={form.jobDescription}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jobDescription: event.target.value,
                    })
                  }
                  rows={8}
                  placeholder="Paste the complete job description here. This will be used later for Resume Match, Cover Letter and Interview Coach."
                  className="settings-input resize-y"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Tip: paste the complete job posting description so
                  ElevAI can use the actual requirements later.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Application Date
                  </label>

                  <input
                    type="date"
                    value={form.applicationDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        applicationDate: event.target.value,
                      })
                    }
                    className="settings-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as JobStatus,
                      })
                    }
                    className="settings-input"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Interview Date
                  </label>

                  <input
                    type="date"
                    value={form.interviewDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        interviewDate: event.target.value,
                      })
                    }
                    className="settings-input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes: event.target.value,
                    })
                  }
                  rows={5}
                  placeholder="Add useful notes about this opportunity..."
                  className="settings-input resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.05]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
                >
                  {editingJobId ? "Save Changes" : "Add Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}