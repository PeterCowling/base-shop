import { stemmedTokenizer } from "@acme/lib";

import { SYNONYMS } from "./template-ranker";

export type QuestionCoverageEntry = {
  question: string;
  matched_count: number;
  required_matches: number;
  coverage_score: number;
  status: "covered" | "partial" | "missing";
};

const STOP_WORDS = new Set([
  "that", "this", "from", "with", "what", "when", "where", "which",
  "have", "does", "will", "would", "could", "should", "there", "their",
  "they", "them", "been", "being", "also", "just", "about", "than",
  "your", "some", "each", "were", "more", "very",
]);

const TOPIC_SYNONYMS: Record<string, string[]> = {
  availability: ["available", "vacancy", "open", "free", "beds", "rooms", "space"],
  available: ["availability", "open", "vacancy", "space", "free", "check"],
  pool: ["swimming", "pool", "rooftop", "facility", "amenity", "outdoor", "water"],
  facility: ["facilities", "amenity", "amenities", "service", "services", "feature"],
  amenity: ["amenities", "facility", "facilities", "included", "feature"],
  kitchen: ["kitchen", "cooking", "cook", "fridge", "microwave", "self-catering"],
  parking: ["parking", "car park", "garage", "vehicle"],
  towel: ["towel", "linen", "sheets", "bedding", "provided"],
  deposit: ["deposit", "security", "hold", "keycard"],
  early: ["early", "arrival", "before", "prior"],
  late: ["late", "after", "extended", "overtime"],
  noise: ["quiet", "silence", "sound", "curfew", "policy"],
  tour: ["tour", "excursion", "activity", "trip", "experience"],
  locker: ["locker", "safe", "storage", "secure"],
};

function tokenize(text: string): string[] {
  return stemmedTokenizer.tokenize(text);
}

export function extractQuestionKeywords(question: string): string[] {
  return question
    .split(/\s+/)
    .map((word) =>
      word.toLowerCase().replace(/[^a-z0-9'-]+$/g, "").replace(/^[^a-z0-9'-]+/, ""),
    )
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 5);
}

export function evaluateQuestionCoverage(
  body: string,
  questions: Array<{ text: string }>,
): QuestionCoverageEntry[] {
  const bodySet = new Set(tokenize(body.toLowerCase()));

  return questions.map((question) => {
    const keywords = extractQuestionKeywords(question.text);
    if (keywords.length === 0) {
      return {
        question: question.text,
        matched_count: 0,
        required_matches: 0,
        coverage_score: 1,
        status: "covered",
      };
    }

    const matched_count = keywords.filter((keyword) => {
      const variants = [keyword, ...(SYNONYMS[keyword] ?? TOPIC_SYNONYMS[keyword] ?? [])];
      return variants.some((variant) => tokenize(variant.toLowerCase()).some((stem) => bodySet.has(stem)));
    }).length;

    const required_matches = keywords.length >= 2 ? 2 : 1;
    const coverage_score = Number((matched_count / keywords.length).toFixed(2));
    const status =
      matched_count === 0 ? "missing" : matched_count < required_matches ? "partial" : "covered";

    return { question: question.text, matched_count, required_matches, coverage_score, status };
  });
}
