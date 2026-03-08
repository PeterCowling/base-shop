import "server-only";

import {
  getBriketteKnowledgeSnapshot,
  type ReceptionKnowledgeResourceUri,
} from "./data.server";

type KnowledgeIntent = { text: string };
type KnowledgeContext = {
  category: string;
  normalizedText: string;
  intents: KnowledgeIntent[];
};

export type KnowledgeSummary = { uri: string; summary: string };
export type KnowledgeSnippet = { citation: string; text: string; score: number };
export type SourcesUsedEntry = {
  uri: string;
  citation: string;
  text: string;
  score: number;
  injected: boolean;
};

export type KnowledgeData = {
  summaries: KnowledgeSummary[];
  injectionCandidates: Array<{ uri: string; snippet: KnowledgeSnippet }>;
};

const DEFAULT_KNOWLEDGE_URIS: ReceptionKnowledgeResourceUri[] = [
  "brikette://faq",
  "brikette://rooms",
  "brikette://pricing/menu",
  "brikette://policies",
];

const KNOWLEDGE_MAX_WORDS_PER_RESOURCE = 500;
const KNOWLEDGE_MAX_SNIPPETS_PER_RESOURCE = 6;
const KNOWLEDGE_STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "there", "have", "about",
  "what", "when", "where", "which", "your", "you", "our", "are", "can", "how",
  "who", "will", "please", "would", "could", "should", "into", "after", "before",
  "need", "want", "like", "time", "day", "days", "night", "nights", "email",
  "booking", "reservation",
]);

const KNOWLEDGE_SCENARIO_TERMS: Record<string, string[]> = {
  cancellation: ["cancel", "cancellation", "refund", "non-refundable", "policy"],
  payment: ["payment", "prepayment", "card", "charge", "invoice", "refund", "balance"],
  policy: ["policy", "rules", "terms", "check-in", "check-out", "age", "pets", "quiet"],
  policies: ["policy", "rules", "terms", "check-in", "check-out", "age", "pets", "quiet"],
  breakfast: ["breakfast", "menu", "food", "meal"],
  luggage: ["luggage", "storage", "bags", "suitcase"],
  wifi: ["wifi", "internet", "connection"],
  "check-in": ["check-in", "arrival", "late arrival", "reception hours"],
  checkout: ["check-out", "departure", "luggage storage"],
  prepayment: ["prepayment", "payment link", "secure payment", "charge"],
  transportation: ["transport", "bus", "ferry", "taxi", "airport"],
  "house-rules": ["rules", "quiet hours", "restrictions", "age", "pets"],
  "booking-changes": ["change", "modify", "reschedule", "dates"],
  "booking-issues": ["issue", "problem", "confirmation"],
  access: ["access", "entry", "door", "code"],
  "lost-found": ["lost", "found", "left behind", "forgot"],
  activities: ["activities", "tour", "hike", "experience"],
  promotions: ["promotion", "discount", "offer", "code"],
  employment: ["job", "employment", "position", "application"],
};

function normalizeParagraphs(text: string): string {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text.trim();
  }
  return words.slice(0, maxWords).join(" ").trim();
}

function tokenizeKnowledgeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !KNOWLEDGE_STOP_WORDS.has(token));
}

function buildKnowledgeTerms(context: KnowledgeContext): string[] {
  const scenarioTerms = KNOWLEDGE_SCENARIO_TERMS[context.category] ?? [];
  const extractedTerms = [
    context.normalizedText,
    ...context.intents.map((intent) => intent.text),
  ].flatMap(tokenizeKnowledgeText);

  return Array.from(
    new Set(
      [...extractedTerms, ...scenarioTerms, context.category.toLowerCase()].filter(
        (term) => term.length >= 3 && !KNOWLEDGE_STOP_WORDS.has(term),
      ),
    ),
  );
}

function scoreKnowledgeSnippet(text: string, terms: string[]): number {
  const normalized = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (normalized.includes(term.toLowerCase())) {
      score += term.length >= 7 ? 2 : 1;
    }
  }
  return score;
}

function createSnippet(citation: string, text: string, terms: string[]): KnowledgeSnippet | null {
  const normalizedText = normalizeParagraphs(text).replace(/\n+/g, " ").trim();
  if (!normalizedText) {
    return null;
  }

  const score = scoreKnowledgeSnippet(normalizedText, terms);
  if (score <= 0) {
    return null;
  }

  return { citation, text: normalizedText, score };
}

function extractFaqSnippets(payload: unknown, terms: string[], citationPrefix: string): KnowledgeSnippet[] {
  const items =
    payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
      ? (payload as { items: unknown[] }).items
      : [];

  const snippets: KnowledgeSnippet[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item || typeof item !== "object") {
      continue;
    }

    const question = typeof (item as { question?: unknown }).question === "string"
      ? (item as { question: string }).question
      : "";
    const answer = typeof (item as { answer?: unknown }).answer === "string"
      ? (item as { answer: string }).answer
      : "";
    if (!question && !answer) {
      continue;
    }

    const id = typeof (item as { id?: unknown }).id === "string"
      ? (item as { id: string }).id
      : String(index + 1);
    const snippet = createSnippet(`${citationPrefix}:${id}`, `Q: ${question} A: ${answer}`, terms);
    if (snippet) {
      snippets.push(snippet);
    }
  }

  return snippets;
}

function extractRoomSnippets(payload: unknown, terms: string[]): KnowledgeSnippet[] {
  const summary =
    payload && typeof payload === "object" && (payload as { summary?: unknown }).summary
      ? (payload as { summary: Record<string, unknown> }).summary
      : null;
  if (!summary || typeof summary !== "object") {
    return [];
  }

  const snippets: KnowledgeSnippet[] = [];
  const roomTypes = Array.isArray(summary.roomTypes) ? summary.roomTypes : [];
  for (let index = 0; index < roomTypes.length; index += 1) {
    const room = roomTypes[index];
    if (!room || typeof room !== "object") {
      continue;
    }
    const record = room as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "Room details";
    const occupancy = typeof record.occupancy === "number" ? `Sleeps ${record.occupancy}.` : "";
    const amenities = Array.isArray(record.amenities)
      ? record.amenities.filter((value): value is string => typeof value === "string").slice(0, 4).join(", ")
      : "";
    const snippet = createSnippet(
      `rooms:${typeof record.sku === "string" ? record.sku : index + 1}`,
      [name, occupancy, amenities ? `Amenities: ${amenities}.` : ""].filter(Boolean).join(" "),
      terms,
    );
    if (snippet) {
      snippets.push(snippet);
    }
  }

  if (typeof summary.note === "string") {
    const snippet = createSnippet("rooms:summary.note", summary.note, terms);
    if (snippet) {
      snippets.push(snippet);
    }
  }

  return snippets;
}

function extractPolicySnippets(payload: unknown, terms: string[]): KnowledgeSnippet[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const snippets: KnowledgeSnippet[] = [];
  const record = payload as Record<string, unknown>;
  if (typeof record.summary === "string") {
    const snippet = createSnippet("policies:summary", record.summary, terms);
    if (snippet) {
      snippets.push(snippet);
    }
  }
  if (Array.isArray(record.faqItems)) {
    snippets.push(...extractFaqSnippets({ items: record.faqItems }, terms, "policies:faq"));
  }

  return snippets;
}

function formatKnowledgeSummary(snippets: KnowledgeSnippet[]): string {
  const selected = [...snippets]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.text.length - right.text.length;
    })
    .slice(0, KNOWLEDGE_MAX_SNIPPETS_PER_RESOURCE);

  return truncateWords(
    selected.map((snippet) => `[${snippet.citation}] ${snippet.text}`).join("\n"),
    KNOWLEDGE_MAX_WORDS_PER_RESOURCE,
  );
}

function extractKnowledgeSnippets(
  uri: ReceptionKnowledgeResourceUri,
  payload: unknown,
  terms: string[],
): KnowledgeSnippet[] {
  switch (uri) {
    case "brikette://faq":
      return extractFaqSnippets(payload, terms, "faq");
    case "brikette://rooms":
      return extractRoomSnippets(payload, terms);
    case "brikette://policies":
      return extractPolicySnippets(payload, terms);
    case "brikette://pricing/menu":
      return [];
    default:
      return [];
  }
}

export function stripCitationMarkers(text: string): string {
  return text.replace(/\[[^\]]+\]\s*/g, "").trim();
}

export function selectKnowledgeCandidateForQuestion(
  question: string,
  candidates: Array<{ uri: string; snippet: KnowledgeSnippet }>,
  usedCitations: Set<string>,
): { uri: string; snippet: KnowledgeSnippet } | null {
  const keywords = tokenizeKnowledgeText(question);
  let bestMatch: { uri: string; snippet: KnowledgeSnippet } | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    if (usedCitations.has(candidate.snippet.citation)) {
      continue;
    }

    let score = candidate.snippet.score;
    const text = candidate.snippet.text.toLowerCase();
    let matched = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 5;
        matched += 1;
      }
    }
    if (keywords.length > 0 && matched === 0) {
      continue;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export function loadKnowledgeData(context: KnowledgeContext): KnowledgeData {
  const snapshot = getBriketteKnowledgeSnapshot();
  const terms = buildKnowledgeTerms(context);
  const summaries: KnowledgeSummary[] = [];
  const injectionCandidates: Array<{ uri: string; snippet: KnowledgeSnippet }> = [];

  for (const uri of DEFAULT_KNOWLEDGE_URIS) {
    const payload = snapshot.resources[uri];
    const snippets = extractKnowledgeSnippets(uri, payload, terms);
    summaries.push({ uri, summary: formatKnowledgeSummary(snippets) });
    for (const snippet of snippets) {
      injectionCandidates.push({ uri, snippet });
    }
  }

  injectionCandidates.sort((left, right) => right.snippet.score - left.snippet.score);
  return { summaries, injectionCandidates };
}
