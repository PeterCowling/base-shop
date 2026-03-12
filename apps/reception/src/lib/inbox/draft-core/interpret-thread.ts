import { stripBookingComRelayBoilerplate } from "../booking-com-relay";

import {
  type LanguageCode,
  type ThreadContext,
  type ThreadMessage,
  type ThreadSummary,
} from "./action-plan";

export function normalizeThread(body: string): string {
  const lines = body.split("\n");
  const cleaned: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const nextTrimmed = lines[index + 1]?.trim() ?? "";

    if (trimmed.startsWith(">")) {
      continue;
    }
    if (/^On .+$/i.test(trimmed) && /^wrote:$/i.test(nextTrimmed)) {
      break;
    }
    if (/^wrote:$/i.test(trimmed) && index > 0 && /^On .+$/i.test(lines[index - 1].trim())) {
      break;
    }
    if (/^On .*wrote:$/i.test(trimmed)) {
      break;
    }
    if (/^From:/i.test(trimmed) || /^Sent:/i.test(trimmed) || /^To:/i.test(trimmed)) {
      break;
    }
    if (/^-----Original Message-----$/i.test(trimmed)) {
      break;
    }

    cleaned.push(line);
  }

  return stripBookingComRelayBoilerplate(cleaned.join("\n").trim());
}

export function detectLanguage(text: string): LanguageCode {
  const lower = text.toLowerCase();
  if (/(\bciao\b|\bgrazie\b|\bbuongiorno\b|\bper favore\b)/.test(lower)) {
    return "IT";
  }
  if (/(\bhola\b|\bgracias\b|\bpor favor\b)/.test(lower)) {
    return "ES";
  }
  if (/[a-z]/i.test(lower)) {
    return "EN";
  }
  return "UNKNOWN";
}

function parseDisplayName(from: string): string {
  const angleMatch = from.match(/^(.*?)<[^>]+>$/);
  if (angleMatch) {
    return angleMatch[1].replace(/"/g, "").trim();
  }

  const atIndex = from.indexOf("@");
  if (atIndex > 0) {
    return from.slice(0, atIndex).trim();
  }

  return from.trim();
}

/**
 * Domain/address patterns that identify messages sent by staff.
 * Separated from personal names so personnel changes don't require code edits.
 */
const STAFF_SENDER_PATTERNS = ["brikette", "hostel", "info@", "hostel-positano.com"];
const STAFF_SENDER_NAMES = ["pete", "cristiana"];

function isStaffSender(from: string): boolean {
  const lower = from.toLowerCase();
  return (
    STAFF_SENDER_PATTERNS.some((pattern) => lower.includes(pattern))
    || STAFF_SENDER_NAMES.some((name) => lower.includes(name))
  );
}

function extractQuestionsFromText(text: string): string[] {
  return text
    .split("?")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^(thanks!?\s*)/i, "").trim())
    .map((segment) => `${segment}?`);
}

export function summarizeThreadContext(
  threadContext: ThreadContext | undefined,
  normalizedText: string,
): ThreadSummary | undefined {
  if (!threadContext || threadContext.messages.length === 0) {
    return undefined;
  }

  const messages = threadContext.messages;
  const staffMessages = messages.filter((message) => isStaffSender(message.from));
  const guestMessages = messages.filter((message) => !isStaffSender(message.from));

  const prior_commitments = staffMessages
    .map((message) => message.snippet.trim())
    .filter(
      (snippet) =>
        /\bwe\b/i.test(snippet) ||
        /\bcan\b/i.test(snippet) ||
        /\bwill\b/i.test(snippet) ||
        /\bincluded\b/i.test(snippet) ||
        /check-?in/i.test(snippet),
    );

  let pendingQuestions: string[] = [];
  const resolved_questions: string[] = [];
  for (const message of messages) {
    if (isStaffSender(message.from)) {
      if (pendingQuestions.length > 0) {
        resolved_questions.push(...pendingQuestions);
        pendingQuestions = [];
      }
      continue;
    }

    const questions = extractQuestionsFromText(message.snippet);
    pendingQuestions.push(...questions);
  }

  const latestGuest = guestMessages[guestMessages.length - 1];
  const open_questions = latestGuest
    ? extractQuestionsFromText(latestGuest.snippet)
    : extractQuestionsFromText(normalizedText);

  const toneFlags = { formal: false, casual: false };
  for (const message of messages) {
    const snippet = message.snippet.toLowerCase();
    if (/(\bdear\b|\bsincerely\b)/.test(snippet)) {
      toneFlags.formal = true;
    }
    if (/(\bhi\b|\bhello\b|\bthanks\b)/.test(snippet)) {
      toneFlags.casual = true;
    }
  }

  const tone_history = toneFlags.formal && toneFlags.casual
    ? "mixed"
    : toneFlags.formal
      ? "formal"
      : "casual";

  const guest_name = latestGuest ? parseDisplayName(latestGuest.from) : "";
  const language_used = detectLanguage(
    `${normalizedText}\n${messages.map((message: ThreadMessage) => message.snippet).join(" ")}`,
  );

  return {
    prior_commitments,
    open_questions,
    resolved_questions,
    tone_history,
    guest_name,
    language_used,
    previous_response_count: staffMessages.length,
  };
}
