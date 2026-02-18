import { stemmedTokenizer } from "@acme/lib";

import { SYNONYMS } from "./template-ranker.js";

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

function tokenize(text: string): string[] {
  return stemmedTokenizer.tokenize(text);
}

export function extractQuestionKeywords(question: string): string[] {
  return question
    .replace(/\?/g, "")
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 5);
}

export function evaluateQuestionCoverage(
  body: string,
  questions: Array<{ text: string }>
): QuestionCoverageEntry[] {
  const bodyTokens = tokenize(body.toLowerCase());
  const bodySet = new Set(bodyTokens);

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

    const matchedKeywords: string[] = [];
    for (const keyword of keywords) {
      const variants = [keyword, ...(SYNONYMS[keyword] ?? [])];
      const matched = variants.some((variant) => {
        const stems = tokenize(variant.toLowerCase());
        return stems.some((stem) => bodySet.has(stem));
      });
      if (matched) {
        matchedKeywords.push(keyword);
      }
    }

    const required_matches = keywords.length >= 2 ? 2 : 1;
    const matched_count = matchedKeywords.length;
    const coverage_score = Number((matched_count / keywords.length).toFixed(2));
    const status =
      matched_count === 0
        ? "missing"
        : matched_count < required_matches
          ? "partial"
          : "covered";

    return {
      question: question.text,
      matched_count,
      required_matches,
      coverage_score,
      status,
    };
  });
}
