import "server-only";

import { generateEmailHtml } from "./draft-core/email-template";

const GRATITUDE_TEMPLATE_SUBJECT = "Guest Thank You Acknowledgement";

const GRATITUDE_PHRASES = [
  "thank you",
  "thanks",
  "thanks so much",
  "thank you so much",
  "many thanks",
  "thank you very much",
  "thanks a lot",
];

type GratitudeDraftInput = {
  subject?: string;
  body: string;
  recipientName?: string;
  hasQuestionsOrRequests: boolean;
};

export type GratitudeReplyDraftResult = {
  plainText: string;
  html: string;
  templateUsed: {
    subject: string;
    category: "faq";
    confidence: number;
    selection: "auto";
  };
};

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyGratitudeOnlyMessage(body: string): boolean {
  const normalized = normalizeForMatch(body);
  if (!normalized) {
    return false;
  }

  if (!GRATITUDE_PHRASES.some((phrase) => normalized.includes(phrase))) {
    return false;
  }

  const withoutGratitude = GRATITUDE_PHRASES.reduce(
    (current, phrase) => current.replaceAll(phrase, " "),
    normalized,
  ).replace(/\s+/g, " ").trim();

  if (!withoutGratitude) {
    return true;
  }

  return /^(you|very|again|all|so|much|for everything)$/.test(withoutGratitude);
}

function buildGratitudeEmailBody(recipientName: string | undefined): string {
  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Guest,";

  return [
    greeting,
    "",
    "You are most welcome :)",
    "",
    "We look forward to seeing you at the hostel.",
  ].join("\n");
}

export async function buildGratitudeReplyDraft(
  input: GratitudeDraftInput,
): Promise<GratitudeReplyDraftResult | null> {
  if (input.hasQuestionsOrRequests || !isLikelyGratitudeOnlyMessage(input.body)) {
    return null;
  }

  const plainText = buildGratitudeEmailBody(input.recipientName);
  const html = generateEmailHtml({
    recipientName: input.recipientName,
    bodyText: plainText,
    subject: input.subject,
  });

  return {
    plainText,
    html,
    templateUsed: {
      subject: GRATITUDE_TEMPLATE_SUBJECT,
      category: "faq",
      confidence: 100,
      selection: "auto",
    },
  };
}
