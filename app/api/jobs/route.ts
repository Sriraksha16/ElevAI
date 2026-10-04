import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

const STATUS_OPTIONS = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

type JobStatus = (typeof STATUS_OPTIONS)[number];

type TimelineEvent = {
  id: string;
  status: JobStatus;
  date: string;
  note: string;
};

type JobRow = {
  id: string;
  company: string;
  job_title: string;
  job_url: string | null;
  location: string | null;
  status: string;
  applied_date: string | null;
  salary: string | null;
  notes: string | null;
  job_description: string | null;
  interview_date: string | null;
  timeline_json: string | null;
  created_at: string;
  updated_at: string;
};

function isJobStatus(value: unknown): value is JobStatus {
  return (
    typeof value === "string" &&
    STATUS_OPTIONS.includes(value as JobStatus)
  );
}

function cleanString(
  value: unknown,
  maxLength: number
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function parseTimeline(
  value: string | null
): TimelineEvent[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" &&
          item !== null
      )
      .map((item) => {
        const status = isJobStatus(item.status)
          ? item.status
          : "Saved";

        return {
          id:
            typeof item.id === "string" && item.id
              ? item.id
              : randomUUID(),
          status,
          date:
            typeof item.date === "string"
              ? item.date
              : "",
          note:
            typeof item.note === "string"
              ? item.note
              : "",
        };
      });
  } catch {
    return [];
  }
}

function sanitizeTimeline(
  value: unknown
): TimelineEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" &&
        item !== null
    )
    .map((item) => {
      const status = isJobStatus(item.status)
        ? item.status
        : "Saved";

      return {
        id:
          typeof item.id === "string" && item.id
            ? item.id
            : randomUUID(),
        status,
        date:
          typeof item.date === "string"
            ? cleanString(item.date, 40)
            : "",
        note:
          typeof item.note === "string"
            ? cleanString(item.note, 1000)
            : "",
      };
    });
}

function toJob(row: JobRow) {
  return {
    id: row.id,
    company: row.company,
    position: row.job_title,
    jobUrl: row.job_url ?? "",
    jobDescription: row.job_description ?? "",
    applicationDate: row.applied_date ?? "",
    status: isJobStatus(row.status)
      ? row.status
      : "Saved",
    notes: row.notes ?? "",
    interviewDate: row.interview_date ?? "",
    timeline: parseTimeline(row.timeline_json),
    location: row.location ?? "",
    salary: row.salary ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

//
// GET JOBS
//
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message:
            "You must be signed in to view your jobs.",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const rows = db
      .prepare(
        `
        SELECT
          id,
          company,
          job_title,
          job_url,
          location,
          status,
          applied_date,
          salary,
          notes,
          job_description,
          interview_date,
          timeline_json,
          created_at,
          updated_at
        FROM job_applications
        WHERE user_id = ?
        ORDER BY created_at DESC
        `
      )
      .all(userId) as JobRow[];

    return Response.json({
      success: true,
      jobs: rows.map(toJob),
    });
  } catch (error) {
    console.error("Jobs GET error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load your jobs.",
      },
      { status: 500 }
    );
  }
}

//
// CREATE JOB
//
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message:
            "You must be signed in to create a job.",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const company = cleanString(body.company, 200);
    const position = cleanString(body.position, 200);
    const jobUrl = cleanString(body.jobUrl, 1000);
    const jobDescription = cleanString(
      body.jobDescription,
      20000
    );
    const applicationDate = cleanString(
      body.applicationDate,
      40
    );
    const notes = cleanString(body.notes, 5000);
    const interviewDate = cleanString(
      body.interviewDate,
      40
    );
    const location = cleanString(body.location, 200);
    const salary = cleanString(body.salary, 200);

    const status: JobStatus = isJobStatus(body.status)
      ? body.status
      : "Saved";

    if (!company) {
      return Response.json(
        {
          success: false,
          message: "Company is required.",
        },
        { status: 400 }
      );
    }

    if (!position) {
      return Response.json(
        {
          success: false,
          message: "Position is required.",
        },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    let timeline = sanitizeTimeline(body.timeline);

    if (timeline.length === 0) {
      timeline = [
        {
          id: randomUUID(),
          status,
          date:
            applicationDate ||
            now.slice(0, 10),
          note: "",
        },
      ];
    }

    db.prepare(
      `
      INSERT INTO job_applications (
        id,
        user_id,
        company,
        job_title,
        job_url,
        location,
        status,
        applied_date,
        salary,
        notes,
        job_description,
        interview_date,
        timeline_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      id,
      userId,
      company,
      position,
      jobUrl || null,
      location || null,
      status,
      applicationDate || null,
      salary || null,
      notes || null,
      jobDescription || null,
      interviewDate || null,
      JSON.stringify(timeline),
      now,
      now
    );

    const row = db
      .prepare(
        `
        SELECT
          id,
          company,
          job_title,
          job_url,
          location,
          status,
          applied_date,
          salary,
          notes,
          job_description,
          interview_date,
          timeline_json,
          created_at,
          updated_at
        FROM job_applications
        WHERE id = ? AND user_id = ?
        LIMIT 1
        `
      )
      .get(id, userId) as JobRow | undefined;

    if (!row) {
      return Response.json(
        {
          success: false,
          message:
            "Job was created but could not be loaded.",
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Job added successfully.",
        job: toJob(row),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Jobs POST error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create the job.",
      },
      { status: 500 }
    );
  }
}

//
// UPDATE JOB
//
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message:
            "You must be signed in to update a job.",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const id = cleanString(body.id, 100);

    if (!id) {
      return Response.json(
        {
          success: false,
          message: "Job ID is required.",
        },
        { status: 400 }
      );
    }

    const existing = db
      .prepare(
        `
        SELECT id
        FROM job_applications
        WHERE id = ? AND user_id = ?
        LIMIT 1
        `
      )
      .get(id, userId) as
      | { id: string }
      | undefined;

    if (!existing) {
      return Response.json(
        {
          success: false,
          message: "Job not found.",
        },
        { status: 404 }
      );
    }

    const company = cleanString(body.company, 200);
    const position = cleanString(body.position, 200);
    const jobUrl = cleanString(body.jobUrl, 1000);
    const jobDescription = cleanString(
      body.jobDescription,
      20000
    );
    const applicationDate = cleanString(
      body.applicationDate,
      40
    );
    const notes = cleanString(body.notes, 5000);
    const interviewDate = cleanString(
      body.interviewDate,
      40
    );
    const location = cleanString(body.location, 200);
    const salary = cleanString(body.salary, 200);

    const status: JobStatus = isJobStatus(body.status)
      ? body.status
      : "Saved";

    if (!company) {
      return Response.json(
        {
          success: false,
          message: "Company is required.",
        },
        { status: 400 }
      );
    }

    if (!position) {
      return Response.json(
        {
          success: false,
          message: "Position is required.",
        },
        { status: 400 }
      );
    }

    const timeline = sanitizeTimeline(
      body.timeline
    );

    const updatedAt = new Date().toISOString();

    db.prepare(
      `
      UPDATE job_applications
      SET
        company = ?,
        job_title = ?,
        job_url = ?,
        location = ?,
        status = ?,
        applied_date = ?,
        salary = ?,
        notes = ?,
        job_description = ?,
        interview_date = ?,
        timeline_json = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
      `
    ).run(
      company,
      position,
      jobUrl || null,
      location || null,
      status,
      applicationDate || null,
      salary || null,
      notes || null,
      jobDescription || null,
      interviewDate || null,
      JSON.stringify(timeline),
      updatedAt,
      id,
      userId
    );

    const row = db
      .prepare(
        `
        SELECT
          id,
          company,
          job_title,
          job_url,
          location,
          status,
          applied_date,
          salary,
          notes,
          job_description,
          interview_date,
          timeline_json,
          created_at,
          updated_at
        FROM job_applications
        WHERE id = ? AND user_id = ?
        LIMIT 1
        `
      )
      .get(id, userId) as JobRow | undefined;

    if (!row) {
      return Response.json(
        {
          success: false,
          message:
            "Unable to load the updated job.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Job updated successfully.",
      job: toJob(row),
    });
  } catch (error) {
    console.error("Jobs PATCH error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to update the job.",
      },
      { status: 500 }
    );
  }
}

//
// DELETE JOB
//
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          message:
            "You must be signed in to delete a job.",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const id = cleanString(body.id, 100);

    if (!id) {
      return Response.json(
        {
          success: false,
          message: "Job ID is required.",
        },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        `
        DELETE FROM job_applications
        WHERE id = ? AND user_id = ?
        `
      )
      .run(id, userId);

    if (result.changes === 0) {
      return Response.json(
        {
          success: false,
          message: "Job not found.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Job deleted successfully.",
    });
  } catch (error) {
    console.error("Jobs DELETE error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to delete the job.",
      },
      { status: 500 }
    );
  }
}