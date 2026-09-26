import jsPDF from "jspdf";

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

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function addPageIfNeeded(
  doc: jsPDF,
  y: number,
  requiredHeight = 20
) {
  if (y + requiredHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }

  return y;
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize = 10,
  lineHeight = 5
) {
  doc.setFontSize(fontSize);

  const lines = doc.splitTextToSize(text, width);

  for (const line of lines) {
    y = addPageIfNeeded(doc, y, lineHeight);

    doc.text(line, x, y);

    y += lineHeight;
  }

  return y;
}

function addSectionTitle(
  doc: jsPDF,
  title: string,
  y: number
) {
  y = addPageIfNeeded(doc, y, 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, MARGIN, y);

  y += 8;

  return y;
}

function addBulletList(
  doc: jsPDF,
  items: string[],
  y: number
) {
  if (!items.length) {
    return y;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  for (const item of items) {
    y = addPageIfNeeded(doc, y, 10);

    const bulletX = MARGIN;
    const textX = MARGIN + 5;

    doc.text("•", bulletX, y);

    y = addWrappedText(
      doc,
      item,
      textX,
      y,
      CONTENT_WIDTH - 5,
      10,
      5
    );

    y += 2;
  }

  return y;
}

function addQuestionCard(
  doc: jsPDF,
  questionNumber: number,
  question: string,
  details: string[],
  y: number,
  difficulty?: string
) {
  y = addPageIfNeeded(doc, y, 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  const title =
    difficulty
      ? `${questionNumber}. ${question} (${difficulty})`
      : `${questionNumber}. ${question}`;

  y = addWrappedText(
    doc,
    title,
    MARGIN,
    y,
    CONTENT_WIDTH,
    10,
    5
  );

  y += 2;

  doc.setFont("helvetica", "normal");

  for (const detail of details) {
    y = addWrappedText(
      doc,
      detail,
      MARGIN + 4,
      y,
      CONTENT_WIDTH - 4,
      9,
      4.5
    );

    y += 1;
  }

  y += 4;

  return y;
}

export function downloadInterviewPreparationPDF(
  result: InterviewCoachResult
) {
  const doc = new jsPDF();

  let y = MARGIN;

  // --------------------------------------------------
  // Header
  // --------------------------------------------------

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("ElevAI", MARGIN, y);

  y += 10;

  doc.setFontSize(18);
  doc.text(
    "Interview Preparation Guide",
    MARGIN,
    y
  );

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  y = addWrappedText(
    doc,
    "AI-generated interview preparation based on the candidate resume and job description.",
    MARGIN,
    y,
    CONTENT_WIDTH,
    10,
    5
  );

  y += 8;

  // --------------------------------------------------
  // Interview Profile
  // --------------------------------------------------

  y = addSectionTitle(
    doc,
    "Interview Profile",
    y
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const profile = result.interviewProfile;

  y = addWrappedText(
    doc,
    `Role: ${profile.role}`,
    MARGIN,
    y,
    CONTENT_WIDTH
  );

  y = addWrappedText(
    doc,
    `Company: ${profile.company}`,
    MARGIN,
    y,
    CONTENT_WIDTH
  );

  y = addWrappedText(
    doc,
    `Experience Level: ${profile.experienceLevel}`,
    MARGIN,
    y,
    CONTENT_WIDTH
  );

  y += 2;

  y = addWrappedText(
    doc,
    `Candidate Positioning: ${profile.candidatePositioning}`,
    MARGIN,
    y,
    CONTENT_WIDTH
  );

  y += 8;

  // --------------------------------------------------
  // Preparation Summary
  // --------------------------------------------------

  y = addSectionTitle(
    doc,
    "Preparation Summary",
    y
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  y = addWrappedText(
    doc,
    "Strengths to Emphasize",
    MARGIN,
    y,
    CONTENT_WIDTH,
    11,
    5
  );

  y += 2;

  y = addBulletList(
    doc,
    result.preparationSummary.strengthsToEmphasize,
    y
  );

  y += 4;

  doc.setFont("helvetica", "bold");

  y = addWrappedText(
    doc,
    "Areas to Prepare",
    MARGIN,
    y,
    CONTENT_WIDTH,
    11,
    5
  );

  y += 2;

  y = addBulletList(
    doc,
    result.preparationSummary.areasToPrepare,
    y
  );

  y += 4;

  doc.setFont("helvetica", "bold");

  y = addWrappedText(
    doc,
    "Preparation Priorities",
    MARGIN,
    y,
    CONTENT_WIDTH,
    11,
    5
  );

  y += 2;

  y = addBulletList(
    doc,
    result.preparationSummary.preparationPriorities,
    y
  );

  y += 6;

  // --------------------------------------------------
  // Technical Questions
  // --------------------------------------------------

  y = addSectionTitle(
    doc,
    "Technical Questions",
    y
  );

  result.technicalQuestions.forEach(
    (item, index) => {
      y = addQuestionCard(
        doc,
        index + 1,
        item.question,
        [
          `Why it may be asked: ${item.whyItMayBeAsked}`,
          `What to cover: ${item.whatToCover.join("; ")}`,
        ],
        y,
        item.difficulty
      );
    }
  );

  // --------------------------------------------------
  // Behavioral Questions
  // --------------------------------------------------

  y = addSectionTitle(
    doc,
    "Behavioral Questions",
    y
  );

  result.behavioralQuestions.forEach(
    (item, index) => {
      y = addQuestionCard(
        doc,
        index + 1,
        item.question,
        [
          `Why it may be asked: ${item.whyItMayBeAsked}`,
          `What to cover: ${item.whatToCover.join("; ")}`,
        ],
        y
      );
    }
  );

  // --------------------------------------------------
  // Resume Questions
  // --------------------------------------------------

  y = addSectionTitle(
    doc,
    "Resume Questions",
    y
  );

  result.resumeQuestions.forEach(
    (item, index) => {
      y = addQuestionCard(
        doc,
        index + 1,
        item.question,
        [
          `Resume evidence: ${item.resumeEvidence}`,
          `Preparation guidance: ${item.preparationGuidance}`,
        ],
        y
      );
    }
  );

  // --------------------------------------------------
  // Job Specific Questions
  // --------------------------------------------------

  y = addSectionTitle(
    doc,
    "Job-Specific Questions",
    y
  );

  result.jobSpecificQuestions.forEach(
    (item, index) => {
      y = addQuestionCard(
        doc,
        index + 1,
        item.question,
        [
          `Related requirement: ${item.relatedRequirement}`,
          `What to cover: ${item.whatToCover.join("; ")}`,
        ],
        y
      );
    }
  );

  // --------------------------------------------------
  // Answer Guidance
  // --------------------------------------------------

  y = addSectionTitle(
    doc,
    "Answer Guidance",
    y
  );

  result.answerGuidance.forEach(
    (item, index) => {
      y = addQuestionCard(
        doc,
        index + 1,
        item.question,
        [
          `Structure: ${item.structure}`,
          `Key points: ${item.keyPoints.join("; ")}`,
        ],
        y
      );
    }
  );

  // --------------------------------------------------
  // Footer on every page
  // --------------------------------------------------

  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
      `ElevAI • Interview Preparation • Page ${page} of ${pageCount}`,
      MARGIN,
      PAGE_HEIGHT - 8
    );
  }

  // --------------------------------------------------
  // Download
  // --------------------------------------------------

  const safeRole =
    profile.role
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "interview";

  doc.save(
    `elevai-${safeRole}-interview-preparation.pdf`
  );
}