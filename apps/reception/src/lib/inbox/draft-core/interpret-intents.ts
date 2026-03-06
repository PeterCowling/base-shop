import { type AgreementDetection, type IntentItem, type WorkflowTriggers } from "./action-plan";

type ClauseSplitPattern = {
  regex: RegExp;
  rightOffset: (matchText: string) => number;
};

const SIGN_OFF_PATTERN = /^(thank|thanks|cheers|regards|kind regards|best|sincerely|looking forward)/i;

const CLAUSE_SPLIT_PATTERNS: ClauseSplitPattern[] = [
  { regex: /^,\s*and also\b\s*/i, rightOffset: (matchText) => matchText.length },
  { regex: /^and also\b\s*/i, rightOffset: (matchText) => matchText.length },
  { regex: /^and what\b\s*/i, rightOffset: () => "and ".length },
  { regex: /^and whether\b\s*/i, rightOffset: () => "and ".length },
  { regex: /^and how\b\s*/i, rightOffset: () => "and ".length },
  { regex: /^and when\b\s*/i, rightOffset: () => "and ".length },
  { regex: /^and where\b\s*/i, rightOffset: () => "and ".length },
  { regex: /^also,\s*/i, rightOffset: (matchText) => matchText.length },
  { regex: /^,\s*and\s+/i, rightOffset: (matchText) => matchText.length },
  { regex: /^but also\b\s*/i, rightOffset: (matchText) => matchText.length },
  { regex: /^as well as\b\s*/i, rightOffset: (matchText) => matchText.length },
  { regex: /^plus\b\s+/i, rightOffset: (matchText) => matchText.length },
];

const LEADING_POLITE_STEM_PATTERNS = [
  /^can you\b\s*/i,
  /^could you\b\s*/i,
  /^would you\b\s*/i,
  /^please\b[\s,]*/i,
  /^i would like\b\s*/i,
];

function extractQuestionsLegacy(text: string): IntentItem[] {
  const parts = text.split("?");
  return parts
    .slice(0, -1)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0 && !SIGN_OFF_PATTERN.test(segment))
    .map((segment) => ({
      text: `${segment}?`,
      evidence: segment,
    }));
}

function extractRequestsLegacy(text: string): IntentItem[] {
  const patterns = [
    /please\s+([^\.\n\r\?]+)[\.\n\r\?]?/gi,
    /(can|could|would) you\s+([^\.\n\r\?]+)[\.\n\r\?]?/gi,
    /i would like\s+([^\.\n\r\?]+)[\.\n\r\?]?/gi,
    /i was wondering if\s+([^\n\r?.]{1,200})[.\n\r?]?/gi,
    /i was wondering\s+([^\n\r?.]{1,200})[.\n\r?]?/gi,
    /we would like\s+([^\.\n\r\?]+)[\.\n\r\?]?/gi,
    /we need\s+([^\.\n\r\?]+)[\.\n\r\?]?/gi,
    /i need\s+([^\.\n\r\?]+)[\.\n\r\?]?/gi,
    /would it be possible to\s+([^\n\r?.]{1,200})[.\n\r?]?/gi,
    /would it be possible\s+([^\n\r?.]{1,200})[.\n\r?]?/gi,
    /please could you\s+([^\.\n\r\?]+)[\.\n\r\?]?/gi,
  ];

  const seen = new Set<string>();
  const requests: IntentItem[] = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const textMatch = match[0].trim();
      const key = textMatch.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        requests.push({ text: textMatch, evidence: textMatch });
      }
    }
  }
  return requests;
}

function extractQuestionsDeterministic(text: string): IntentItem[] {
  const segments = text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[?.!])\s+|\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const items: IntentItem[] = [];
  for (const segment of segments) {
    if (!segment.endsWith("?")) {
      continue;
    }
    if (SIGN_OFF_PATTERN.test(segment)) {
      continue;
    }

    const tokens = segment.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) {
      continue;
    }

    items.push({ text: segment, evidence: segment.replace(/\?$/, "") });
  }

  return items;
}

function extractRequestsDeterministic(text: string): IntentItem[] {
  const patterns = [
    /\bplease\s+([^.\n\r?]+)/gi,
    /\b(can|could|would) you\s+([^.\n\r?]+)/gi,
    /\bwe need\s+([^.\n\r?]+)/gi,
    /\bi need\s+([^.\n\r?]+)/gi,
  ];

  const seen = new Set<string>();
  const requests: IntentItem[] = [];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const textMatch = match[0].trim();
      const key = textMatch.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      requests.push({ text: textMatch, evidence: textMatch });
    }
  }

  return requests;
}

function scoreIntentConfidence(
  text: string,
  questions: IntentItem[],
  requests: IntentItem[],
): number {
  const cueCount = (text.match(/\?/g) ?? []).length;
  const politeCount = (
    text.match(/\b(please|can you|could you|would you|i need|we need)\b/gi) ?? []
  ).length;
  const signal =
    questions.length * 0.45 + requests.length * 0.35 + cueCount * 0.1 + politeCount * 0.1;
  return Number(Math.max(0, Math.min(1, signal / 4)).toFixed(2));
}

function cleanAtomizedFragment(text: string): string {
  return text.trim().replace(/^[,;:\-\s]+/u, "").replace(/[,;:\-\s]+$/u, "").trim();
}

function countFragmentWords(text: string): number {
  return cleanAtomizedFragment(text)
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function isStandaloneSingleQuote(text: string, index: number): boolean {
  const previous = text[index - 1] ?? "";
  const next = text[index + 1] ?? "";
  return !/[A-Za-z0-9]/.test(previous) || !/[A-Za-z0-9]/.test(next);
}

function findCompoundClauseSplit(text: string): { left: string; right: string } | undefined {
  let inDoubleQuotes = false;
  let inSingleQuotes = false;
  let parenthesisDepth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (!inDoubleQuotes && !inSingleQuotes) {
      if (character === "(") {
        parenthesisDepth += 1;
        continue;
      }
      if (character === ")" && parenthesisDepth > 0) {
        parenthesisDepth -= 1;
        continue;
      }
    }

    if (character === "\"" && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }
    if (character === "'" && !inDoubleQuotes && isStandaloneSingleQuote(text, index)) {
      inSingleQuotes = !inSingleQuotes;
      continue;
    }

    if (inDoubleQuotes || inSingleQuotes || parenthesisDepth > 0) {
      continue;
    }

    const slice = text.slice(index);
    for (const pattern of CLAUSE_SPLIT_PATTERNS) {
      const match = slice.match(pattern.regex);
      if (!match) {
        continue;
      }

      const left = cleanAtomizedFragment(text.slice(0, index));
      const right = cleanAtomizedFragment(text.slice(index + pattern.rightOffset(match[0])));
      if (countFragmentWords(left) < 3 || countFragmentWords(right) < 3) {
        continue;
      }

      return { left, right };
    }
  }

  return undefined;
}

function splitCompoundClauses(text: string): string[] {
  const split = findCompoundClauseSplit(text);
  if (!split) {
    return [text];
  }
  return [...splitCompoundClauses(split.left), ...splitCompoundClauses(split.right)];
}

function shouldMarkAtomizedFragmentsAsQuestions(text: string): boolean {
  return (
    text.includes("?") ||
    /\b(i would like to know|i want to know|would like to know|want to know|i was wondering if|can you tell me|could you tell me|would you tell me|tell me about)\b/i.test(
      text,
    )
  );
}

function trimEdgePunctuation(text: string): string {
  return text
    .replace(/^[\s"'`“”‘’.,!?;:()[\]{}-]+/u, "")
    .replace(/[\s"'`“”‘’.,!?;:()[\]{}-]+$/u, "")
    .trim();
}

function normalizeIntentOverlapText(text: string): string {
  let normalized = trimEdgePunctuation(text.toLowerCase());

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of LEADING_POLITE_STEM_PATTERNS) {
      const stripped = normalized.replace(pattern, "");
      if (stripped !== normalized) {
        normalized = trimEdgePunctuation(stripped);
        changed = true;
      }
    }
  }

  return normalized.replace(/\s+/g, " ");
}

function longestCommonSubstringLength(left: string, right: string): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const previous = new Array<number>(right.length + 1).fill(0);
  const current = new Array<number>(right.length + 1).fill(0);
  let maxLength = 0;

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      if (left[leftIndex - 1] === right[rightIndex - 1]) {
        current[rightIndex] = previous[rightIndex - 1] + 1;
        maxLength = Math.max(maxLength, current[rightIndex]);
      } else {
        current[rightIndex] = 0;
      }
    }

    previous.splice(0, previous.length, ...current);
    current.fill(0);
  }

  return maxLength;
}

function shouldDropRequestForQuestionOverlap(request: IntentItem, question: IntentItem): boolean {
  const normalizedRequest = normalizeIntentOverlapText(request.text);
  const normalizedQuestion = normalizeIntentOverlapText(question.text);
  if (normalizedRequest.length === 0 || normalizedQuestion.length === 0) {
    return false;
  }

  const shorterLength = Math.min(normalizedRequest.length, normalizedQuestion.length);
  const overlapLength = longestCommonSubstringLength(normalizedRequest, normalizedQuestion);
  return overlapLength / shorterLength >= 0.7;
}

function dedupRequestsAgainstQuestions(
  questions: IntentItem[],
  requests: IntentItem[],
): IntentItem[] {
  return requests.filter(
    (request) => !questions.some((question) => shouldDropRequestForQuestionOverlap(request, question)),
  );
}

function atomizeCompoundClauses(text: string): string[] {
  const fragments = splitCompoundClauses(text);
  if (fragments.length === 1) {
    return [text];
  }

  const questionLike = shouldMarkAtomizedFragmentsAsQuestions(text);
  return fragments.map((fragment) => {
    const cleaned = cleanAtomizedFragment(fragment);
    if (!questionLike || /[?.!]$/.test(cleaned)) {
      return cleaned;
    }
    return `${cleaned}?`;
  });
}

export function routeIntents(text: string): {
  questions: IntentItem[];
  requests: IntentItem[];
  selected: "deterministic" | "legacy";
  fallback_reason?: string;
  deterministic_confidence: number;
  legacy_confidence: number;
} {
  const fragments = atomizeCompoundClauses(text);

  const legacyQuestions = fragments.flatMap((fragment) => extractQuestionsLegacy(fragment));
  const legacyRequests = dedupRequestsAgainstQuestions(
    legacyQuestions,
    fragments.flatMap((fragment) => extractRequestsLegacy(fragment)),
  );
  const deterministicQuestions = fragments.flatMap((fragment) =>
    extractQuestionsDeterministic(fragment),
  );
  const deterministicRequests = dedupRequestsAgainstQuestions(
    deterministicQuestions,
    fragments.flatMap((fragment) => extractRequestsDeterministic(fragment)),
  );

  const deterministicConfidence = scoreIntentConfidence(
    text,
    deterministicQuestions,
    deterministicRequests,
  );
  const legacyConfidence = scoreIntentConfidence(text, legacyQuestions, legacyRequests);

  const deterministicTotal = deterministicQuestions.length + deterministicRequests.length;
  const legacyTotal = legacyQuestions.length + legacyRequests.length;
  if (deterministicTotal < legacyTotal) {
    return {
      questions: legacyQuestions,
      requests: legacyRequests,
      selected: "legacy",
      fallback_reason: "deterministic_under_extract",
      deterministic_confidence: deterministicConfidence,
      legacy_confidence: legacyConfidence,
    };
  }

  return {
    questions: deterministicQuestions,
    requests: deterministicRequests,
    selected: "deterministic",
    deterministic_confidence: deterministicConfidence,
    legacy_confidence: legacyConfidence,
  };
}

export function extractConfirmations(text: string): IntentItem[] {
  const confirmations: IntentItem[] = [];
  const patterns = [/\bconfirmed\b/i, /\bi confirm\b/i, /\byes\b/i, /\bokay\b/i, /\bok\b/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      confirmations.push({ text: match[0], evidence: match[0] });
    }
  }
  return confirmations;
}

export function detectAgreement(text: string, language: string): AgreementDetection {
  const lower = text.toLowerCase();
  const explicitPatterns = [
    /^\s*agree(?:[!.,\s]|$)/i,
    /\b(i agree|we agree|agreed)\b/i,
    /\baccetto\b/i,
    /\bde acuerdo\b/i,
  ];
  const negationPatterns = [
    /\b(don't agree|do not agree|cannot agree|can't agree)\b/i,
    /\bnon sono d'accordo\b/i,
    /\bno estoy de acuerdo\b/i,
  ];
  const contrastPatterns = [/\bbut\b/i, /\bhowever\b/i, /\bma\b/i, /\bpero\b/i];

  const evidence_spans: AgreementDetection["evidence_spans"] = [];

  let negated = false;
  for (const pattern of negationPatterns) {
    const match = pattern.exec(text);
    if (match) {
      negated = true;
      evidence_spans.push({
        text: match[0],
        position: match.index ?? 0,
        is_negated: true,
      });
      break;
    }
  }

  let explicitMatch: RegExpExecArray | null = null;
  for (const pattern of explicitPatterns) {
    const match = pattern.exec(text);
    if (match) {
      explicitMatch = match;
      evidence_spans.push({
        text: match[0],
        position: match.index ?? 0,
        is_negated: false,
      });
      break;
    }
  }

  const contrast = contrastPatterns.some((pattern) => pattern.test(text));
  const residual = explicitMatch ? lower.replace(explicitMatch[0].toLowerCase(), "") : lower;
  const normalizedResidual = residual.replace(/[^\p{L}\p{N}]+/gu, "").trim();
  const additional_content = explicitMatch
    ? normalizedResidual.length > 0
    : lower.trim().length > 0;

  if (negated) {
    return {
      status: "none",
      confidence: 0,
      evidence_spans,
      requires_human_confirmation: false,
      detected_language: language,
      additional_content,
    };
  }

  if (explicitMatch) {
    if (contrast) {
      return {
        status: "likely",
        confidence: 60,
        evidence_spans,
        requires_human_confirmation: true,
        detected_language: language,
        additional_content,
      };
    }

    return {
      status: "confirmed",
      confidence: 90,
      evidence_spans,
      requires_human_confirmation: false,
      detected_language: language,
      additional_content,
    };
  }

  if (/^\s*(yes|ok|okay)\s*[\.!]?$/.test(lower)) {
    return {
      status: "unclear",
      confidence: 40,
      evidence_spans: [],
      requires_human_confirmation: true,
      detected_language: language,
      additional_content: false,
    };
  }

  return {
    status: "none",
    confidence: 0,
    evidence_spans: [],
    requires_human_confirmation: false,
    detected_language: language,
    additional_content,
  };
}

export function detectWorkflowTriggers(text: string): WorkflowTriggers {
  const lower = text.toLowerCase();
  const bookingModificationRequested = [
    "cancel",
    "modify",
    "change",
    "update",
    "extend",
    "shorten",
  ].some((verb) =>
    ["booking", "reservation", "stay"].some(
      (target) => lower.includes(`${verb} ${target}`) || lower.includes(`${verb} my ${target}`),
    ),
  );
  const bookingCreationRequested = [
    /new booking/,
    /new reservation/,
    /make\s+a\s+(booking|reservation)/,
    /book\s+a\s+(room|bed|dorm|hostel)/,
    /i\s+would\s+like\s+to\s+book/,
    /please\s+reserve/,
    /i\s+want\s+to\s+book/,
    /confirm\s+my\s+(booking|reservation)/,
  ].some((pattern) => pattern.test(lower));
  const bookingActionRequired = bookingModificationRequested || bookingCreationRequested;

  return {
    prepayment: /(payment|card|prepayment|bank transfer)/.test(lower),
    terms_and_conditions: /(terms|t&c|non[-\s]?refundable|conditions)/.test(lower),
    booking_action_required: bookingActionRequired,
    booking_context: /(reservation|booking)/.test(lower),
  };
}
