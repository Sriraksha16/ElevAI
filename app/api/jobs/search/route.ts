import { NextRequest, NextResponse } from "next/server";

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category?: string;
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
};

type RemotiveResponse = {
  jobs?: RemotiveJob[];
  "job-count"?: number;
};

const categoryAliases: Record<string, string> = {
  "software-dev": "software development",
  data: "data and analytics",
};

function normalizeCategory(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const category =
      searchParams.get("category")?.trim() || "";

    const params = new URLSearchParams();

    params.set("limit", "20");

    if (search) {
      params.set("search", search);
    }

    if (category) {
      params.set("category", category);
    }

    const apiUrl =
      `https://remotive.com/api/remote-jobs?${params.toString()}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },

      // Don't aggressively cache job searches.
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Job provider returned ${response.status}.`
      );
    }

    const data =
      (await response.json()) as RemotiveResponse;

    const normalizedJobs = (data.jobs || []).map((job) => ({
      id: String(job.id),
      title: job.title,
      company: job.company_name,
      companyLogo: job.company_logo || null,
      category: job.category || "",
      jobType: job.job_type || "",
      publishedAt: job.publication_date || "",
      location:
        job.candidate_required_location ||
        "Remote",
      salary: job.salary || "",
      description: job.description || "",
      url: job.url,
      source: "Remotive",
    }));

    const normalizedSearch = search.toLowerCase();
    const categoryKey = category.toLowerCase();
    const normalizedCategory = normalizeCategory(
      categoryAliases[categoryKey] || category
    );

    const jobs = normalizedJobs.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        `${job.title} ${job.description}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        !normalizedCategory ||
        normalizeCategory(job.category) === normalizedCategory;

      return matchesSearch && matchesCategory;
    });

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error(
      "Job discovery search error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to search jobs.",
        jobs: [],
      },
      { status: 500 }
    );
  }
}