import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { id } from "zod/v4/locales";

const dataDirectory = path.join(process.cwd(), "data");

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const databasePath = path.join(dataDirectory, "elevai.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

//
// USERS
//
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    career_title TEXT NOT NULL DEFAULT 'Career Explorer',
    created_at TEXT NOT NULL,
    reset_token_hash TEXT,
    reset_token_expires_at TEXT
  )
`);

function addColumnIfMissing(
  table: string,
  column: string,
  definition: string
) {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as { name: string }[];

  const exists = columns.some(
    (item) => item.name === column
  );

  if (!exists) {
    db.exec(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    );
  }
}

//
// EXISTING USER COLUMNS
//
addColumnIfMissing(
  "users",
  "reset_token_hash",
  "TEXT"
);

addColumnIfMissing(
  "users",
  "reset_token_expires_at",
  "TEXT"
);

//
// USER SETTINGS
//
db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    preferred_tone TEXT NOT NULL DEFAULT 'professional',
    resume_format TEXT NOT NULL DEFAULT 'pdf',
    email_notifications INTEGER NOT NULL DEFAULT 1,
    application_reminders INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

//
// RESUMES
//
db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    resume_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

addColumnIfMissing(
  "resumes",
  "content_hash",
  "TEXT"
);

//
// RESUME ANALYSES
//
db.exec(`
  CREATE TABLE IF NOT EXISTS resume_analyses (
    id TEXT PRIMARY KEY,
    resume_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    scores_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

//
// RESUME INDEXES
//
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_resumes_user_id
  ON resumes(user_id);

  CREATE INDEX IF NOT EXISTS idx_resumes_user_hash
  ON resumes(user_id, content_hash);

  CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id
  ON resume_analyses(user_id);

  CREATE INDEX IF NOT EXISTS idx_resume_analyses_resume_id
  ON resume_analyses(resume_id);
`);

//
// JOB APPLICATIONS
//
db.exec(`
  CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_url TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'Saved',
    applied_date TEXT,
    salary TEXT,
    notes TEXT,
    job_description TEXT,
    interview_date TEXT,
    timeline_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

//
// JOB APPLICATION MIGRATION
//
// These make sure an existing ElevAI database gets the
// new Job Tracker fields without losing existing jobs.
//
addColumnIfMissing(
  "job_applications",
  "job_description",
  "TEXT"
);

addColumnIfMissing(
  "job_applications",
  "interview_date",
  "TEXT"
);

addColumnIfMissing(
  "job_applications",
  "timeline_json",
  "TEXT"
);

//
// CAREER INSIGHTS
//
db.exec(`
  CREATE TABLE IF NOT EXISTS career_insights (
    id TEXT PRIMARY KEY,
    resume_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    insights_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, resume_id),
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

//
// CAREER INSIGHTS INDEX
//
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_career_insights_user_resume
  ON career_insights(user_id, resume_id);

  CREATE INDEX IF NOT EXISTS idx_career_insights_user_id
  ON career_insights(user_id);
`);


//
// AI USAGE TRACKING
// Records AI generation reservations and completed generations.
// Reservations prevent concurrent requests from exceeding limits.
//
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    period_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reserved'
      CHECK (status IN ('reserved', 'completed')),
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature_period
  ON ai_usage(user_id, feature, period_key, status);
`);

//
// USER ENTITLEMENTS
// Premium access will be activated only by verified server-side payment.
//
db.exec(`
  CREATE TABLE IF NOT EXISTS user_entitlements (
    user_id TEXT PRIMARY KEY,
    plan TEXT NOT NULL DEFAULT 'free'
      CHECK (plan IN ('free', 'premium')),
    premium_started_at TEXT,
    premium_expires_at TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);


export default db;