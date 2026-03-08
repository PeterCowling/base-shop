import "server-only";

import {
  type EmailActionPlan,
  type IntentItem,
  type ScenarioClassification,
} from "./action-plan";
import { evaluateQuestionCoverage } from "./coverage";
import { getDraftGuideData, getEmailTemplates, getVoiceExamplesData } from "./data.server";
import { stripLegacySignatureBlock } from "./email-signature";
import { generateEmailHtml } from "./email-template";
import {
  type KnowledgeSummary,
  loadKnowledgeData,
  selectKnowledgeCandidateForQuestion,
  type SourcesUsedEntry,
  stripCitationMarkers,
} from "./generate-knowledge";
import { evaluatePolicy, type PolicyDecision } from "./policy-decision";
import { resolveSlots } from "./slot-resolver";
import {
  type EmailTemplate,
  normalizeScenarioCategory,
  type PerQuestionRankEntry,
  type PrepaymentProvider,
  type PrepaymentStep,
  rankTemplates,
  rankTemplatesPerQuestion,
} from "./template-ranker";

type LooseEmailActionPlan = Partial<EmailActionPlan> | null | undefined;

export type DraftGenerationInput = {
  actionPlan: LooseEmailActionPlan;
  subject?: string;
  recipientName?: string;
  prepaymentStep?: PrepaymentStep;
  prepaymentProvider?: PrepaymentProvider;
  guestRoomNumbers?: string[];
};

type QuestionAnswerBlock = {
  question: string;
  label: string;
  answer: string;
  answerSource: "template" | "knowledge" | "template+knowledge" | "follow_up";
  templateSubject: string | null;
  templateCategory: string | null;
  knowledgeCitation: string | null;
  followUpRequired: boolean;
};

export type DraftGenerationResult = {
  draftId: string;
  draft: { bodyPlain: string; bodyHtml: string };
  templateUsed: {
    subject: string | null;
    category: string | null;
    confidence: number;
    selection: "auto" | "suggest" | "none" | "composite";
  };
  questionBlocks: Array<{
    question: string;
    label: string;
    answerSource: QuestionAnswerBlock["answerSource"];
    templateSubject: string | null;
    templateCategory: string | null;
    knowledgeCitation: string | null;
    followUpRequired: boolean;
  }>;
  knowledgeSources: string[];
  knowledgeSummaries: KnowledgeSummary[];
  sourcesUsed: SourcesUsedEntry[];
  slotResolution: {
    selected: "deterministic" | "legacy";
    fallbackReason?: string;
    unresolvedSlots: string[];
  };
  policy: PolicyDecision;
  deliveryStatus: "ready" | "needs_follow_up";
};

const FALLBACK_BODY = "Thanks for your email. We will review your request and respond shortly.";
const CONDITIONAL_RULE_SNIPPETS: Record<string, string> = {
  policy: "Per our policy, please review the full terms on our website.",
  policies: "Per our policy, please review the full terms on our website.",
  cancellation:
    "Per the cancellation policy, please review your confirmation terms and let us know if we can help with next steps.",
  payment: "If you need help completing payment, please let us know and we will guide you.",
};
const QUESTION_LABEL_STOP_WORDS = new Set([
  "a", "about", "also", "an", "and", "are", "be", "can", "could", "details", "do", "does",
  "for", "have", "how", "i", "if", "in", "is", "it", "know", "let", "me", "my", "of", "on",
  "or", "our", "please", "tell", "the", "there", "to", "us", "we", "what", "when", "where",
  "which", "would", "you", "your",
]);
const DEFAULT_COMPOSITE_LIMIT = 3;
const UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70;
const ESCALATION_FALLBACK_SENTENCE =
  "For this specific question we want to give you the most accurate answer - Pete or Cristiana will follow up with you directly.";

function coerceActionPlan(input: LooseEmailActionPlan): EmailActionPlan {
  const candidate = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const intents = (candidate.intents as Record<string, unknown> | undefined) ?? {};
  const scenario = (candidate.scenario as Record<string, unknown> | undefined) ?? {};
  const escalation = (candidate.escalation as Record<string, unknown> | undefined) ?? {};
  const validIntents = (value: unknown): IntentItem[] =>
    Array.isArray(value)
      ? value
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .map((item) => ({
            text: typeof item.text === "string" ? item.text : "",
            evidence: typeof item.evidence === "string" ? item.evidence : typeof item.text === "string" ? item.text : "",
          }))
          .filter((item) => item.text.length > 0)
      : [];
  const primaryScenario: ScenarioClassification = {
    category:
      typeof scenario.category === "string"
        ? normalizeScenarioCategory(scenario.category) ?? "general"
        : "general",
    confidence: typeof scenario.confidence === "number" ? scenario.confidence : 0.6,
  };

  return {
    normalized_text: typeof candidate.normalized_text === "string" ? candidate.normalized_text : "",
    language:
      candidate.language === "EN" || candidate.language === "IT" || candidate.language === "ES"
        ? candidate.language
        : "UNKNOWN",
    intents: {
      questions: validIntents(intents.questions),
      requests: validIntents(intents.requests),
      confirmations: validIntents(intents.confirmations),
    },
    agreement: {
      status:
        candidate.agreement && typeof candidate.agreement === "object" &&
        ["confirmed", "likely", "unclear", "none"].includes((candidate.agreement as { status?: string }).status ?? "")
          ? ((candidate.agreement as { status: EmailActionPlan["agreement"]["status"] }).status)
          : "none",
      confidence: 0,
      evidence_spans: [],
      requires_human_confirmation: false,
      detected_language: typeof candidate.language === "string" ? candidate.language : "UNKNOWN",
      additional_content: false,
    },
    workflow_triggers: {
      booking_action_required: Boolean((candidate.workflow_triggers as { booking_action_required?: boolean } | undefined)?.booking_action_required),
      booking_context: Boolean((candidate.workflow_triggers as { booking_context?: boolean } | undefined)?.booking_context),
      prepayment: Boolean((candidate.workflow_triggers as { prepayment?: boolean } | undefined)?.prepayment),
      terms_and_conditions: Boolean((candidate.workflow_triggers as { terms_and_conditions?: boolean } | undefined)?.terms_and_conditions),
    },
    scenario: primaryScenario,
    scenarios: [primaryScenario],
    actionPlanVersion: "1.1.0",
    escalation: {
      tier:
        escalation.tier === "HIGH" || escalation.tier === "CRITICAL" || escalation.tier === "NONE"
          ? escalation.tier
          : "NONE",
      triggers: Array.isArray(escalation.triggers) ? escalation.triggers.filter((item): item is string => typeof item === "string") : [],
      confidence: typeof escalation.confidence === "number" ? escalation.confidence : 0,
    },
    escalation_required: false,
  };
}

function normalizeParagraphs(text: string): string {
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function includesCaseInsensitive(body: string, phrase: string): boolean {
  return body.toLowerCase().includes(phrase.toLowerCase());
}

function removeForbiddenPhrases(body: string, phrases: string[]): string {
  let sanitized = body;
  for (const phrase of [...new Set(phrases.map((value) => value.trim()).filter(Boolean))]) {
    let lower = sanitized.toLowerCase();
    const target = phrase.toLowerCase();
    let index = lower.indexOf(target);
    while (index !== -1) {
      sanitized = `${sanitized.slice(0, index)}${sanitized.slice(index + phrase.length)}`;
      lower = sanitized.toLowerCase();
      index = lower.indexOf(target);
    }
  }
  return normalizeParagraphs(sanitized);
}

function extractContentBody(body: string): string {
  return stripLegacySignatureBlock(body.replace(/^Dear\s+\w+[\s\S]*?\r?\n\r?\n/i, "").replace(/^(Thank\s+you\s+for\s+[\s\S]*?\.\s*\r?\n\r?\n)/i, "")).trim();
}

function personalizeGreeting(body: string, recipientName?: string): { body: string; slots: Record<string, string> } {
  if (!recipientName || !/^Dear\s+Guest,/i.test(body.trimStart())) {
    return { body, slots: {} };
  }
  return {
    body: body.trimStart().replace(/^Dear\s+Guest,/i, "{{SLOT:GREETING}}"),
    slots: { GREETING: `Dear ${recipientName},` },
  };
}

function resolveSlotsWithParity(body: string, slots: Record<string, string>) {
  const unresolved = new Set<string>();
  const deterministic = body.replace(/\{\{SLOT:([A-Z_]+)\}\}/g, (_match, key: string) => {
    const value = slots[key];
    if (!value) {
      unresolved.add(key);
      return `{{SLOT:${key}}}`;
    }
    return value;
  });
  return unresolved.size > 0
    ? {
        body: resolveSlots(body, slots),
        selected: "legacy" as const,
        fallbackReason: "unresolved_slot_markers",
        unresolvedSlots: Array.from(unresolved),
      }
    : { body: deterministic, selected: "deterministic" as const, unresolvedSlots: [] };
}

function buildQuestionLabel(question: string): string {
  const tokens = question
    .replace(/\r?\n/g, " ")
    .replace(/[?!.]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9-]+$/gi, ""))
    .filter(Boolean)
    .filter((token) => !QUESTION_LABEL_STOP_WORDS.has(token.toLowerCase()))
    .slice(0, 4);
  return tokens.length === 0 ? "Follow-up" : tokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()).join(" ");
}

function selectAvailabilityTemplate(templates: EmailTemplate[]): EmailTemplate | undefined {
  return templates.find((template) => template.category === "booking-issues" && /availability/i.test(template.subject))
    ?? templates.find((template) => template.category === "booking-issues" && /live availability/i.test(template.body));
}

function selectAgreementTemplate(templates: EmailTemplate[]): EmailTemplate | undefined {
  return templates.find((template) => template.category === "general" && /^agreement received$/i.test(template.subject.trim()));
}

function buildCompositeQuestionBlocks(actionPlan: EmailActionPlan, templates: EmailTemplate[]): QuestionAnswerBlock[] {
  if (actionPlan.intents.questions.length < 2) {
    return [];
  }
  const categoryHints = new Set((actionPlan.scenarios ?? [actionPlan.scenario]).map((scenario) => normalizeScenarioCategory(scenario.category) ?? "general"));
  const perQuestionRanks = rankTemplatesPerQuestion(actionPlan.intents.questions, templates, DEFAULT_COMPOSITE_LIMIT);
  return perQuestionRanks.slice(0, DEFAULT_COMPOSITE_LIMIT).map((entry: PerQuestionRankEntry) => {
    const hintedCandidates = entry.candidates.filter((candidate) =>
      categoryHints.has(normalizeScenarioCategory(candidate.template.category) ?? "general"),
    );
    const candidate = hintedCandidates[0] ?? (entry.candidates[0] && ((entry.candidates[0].adjustedConfidence ?? entry.candidates[0].confidence) >= UNHINTED_TEMPLATE_CONFIDENCE_FLOOR ? entry.candidates[0] : undefined));
    return {
      question: entry.question,
      label: buildQuestionLabel(entry.question),
      answer: candidate ? extractContentBody(candidate.template.body) : "",
      answerSource: candidate ? "template" : "follow_up",
      templateSubject: candidate?.template.subject ?? null,
      templateCategory: candidate?.template.category ?? null,
      knowledgeCitation: null,
      followUpRequired: !candidate,
    };
  });
}

function hydrateQuestionBlocks(
  blocks: QuestionAnswerBlock[],
  candidates: ReturnType<typeof loadKnowledgeData>["injectionCandidates"],
): { blocks: QuestionAnswerBlock[]; sourcesUsed: SourcesUsedEntry[] } {
  const sourcesUsed: SourcesUsedEntry[] = [];
  const usedCitations = new Set<string>();
  const nextBlocks = blocks.map((block) => {
    const nextBlock = { ...block };
    const coverage = evaluateQuestionCoverage(nextBlock.answer, [{ text: block.question }])[0];
    if (coverage.status !== "covered") {
      const knowledgeMatch = selectKnowledgeCandidateForQuestion(block.question, candidates, usedCitations);
      if (knowledgeMatch) {
        usedCitations.add(knowledgeMatch.snippet.citation);
        const cleanText = stripCitationMarkers(knowledgeMatch.snippet.text);
        nextBlock.answer = nextBlock.answer ? normalizeParagraphs(`${nextBlock.answer}\n\n${cleanText}`) : cleanText;
        nextBlock.answerSource = nextBlock.templateSubject === null ? "knowledge" : "template+knowledge";
        nextBlock.knowledgeCitation = knowledgeMatch.snippet.citation;
        sourcesUsed.push({ uri: knowledgeMatch.uri, citation: knowledgeMatch.snippet.citation, text: cleanText, score: knowledgeMatch.snippet.score, injected: true });
      }
    }
    if (evaluateQuestionCoverage(nextBlock.answer, [{ text: block.question }])[0].status !== "covered") {
      nextBlock.answer = nextBlock.answer ? normalizeParagraphs(`${nextBlock.answer}\n\n${ESCALATION_FALLBACK_SENTENCE}`) : ESCALATION_FALLBACK_SENTENCE;
      nextBlock.followUpRequired = true;
    }
    return nextBlock;
  });
  return { blocks: nextBlocks, sourcesUsed };
}

export function generateDraftCandidate(input: DraftGenerationInput): DraftGenerationResult {
  const actionPlan = coerceActionPlan(input.actionPlan);
  const primaryCategory = (actionPlan.scenarios?.[0]?.category ?? actionPlan.scenario.category) || "general";
  const templates = getEmailTemplates();
  const allIntents = [...actionPlan.intents.questions, ...actionPlan.intents.requests];
  const knowledge = loadKnowledgeData({ category: primaryCategory, normalizedText: actionPlan.normalized_text, intents: allIntents });
  const rankResult = rankTemplates(templates, {
    subject: input.subject ?? "",
    body: actionPlan.normalized_text,
    categoryHint: primaryCategory,
    prepaymentStep: input.prepaymentStep,
    prepaymentProvider: input.prepaymentProvider,
  });
  const policyDecision = evaluatePolicy(actionPlan);
  const policyCandidates = (policyDecision.templateConstraints.allowedCategories?.length
    ? rankResult.candidates.filter((candidate) =>
        policyDecision.templateConstraints.allowedCategories?.includes(
          normalizeScenarioCategory(candidate.template.category) ?? "general",
        ),
      )
    : rankResult.candidates);
  const selectedTemplate =
    (actionPlan.agreement.status === "confirmed" && !actionPlan.agreement.additional_content && actionPlan.intents.questions.length === 0 && actionPlan.intents.requests.length === 0
      ? selectAgreementTemplate(templates)
      : undefined)
    ?? ((`${actionPlan.normalized_text} ${actionPlan.intents.questions.map((question) => question.text).join(" ")}`.toLowerCase().match(/availability/) ? selectAvailabilityTemplate(templates) : undefined))
    ?? (rankResult.selection !== "none" ? policyCandidates[0]?.template : undefined);

  let questionBlocks = buildCompositeQuestionBlocks(actionPlan, templates);
  let bodyPlain = questionBlocks.length >= 2
    ? ["Dear Guest,", "Thank you for your email. Please find our answers below.", questionBlocks.map((block, index) => `${index + 1}. ${block.label}\n${normalizeParagraphs(block.answer)}`).join("\n\n")].join("\n\n")
    : selectedTemplate?.body ?? FALLBACK_BODY;

  const sourcesUsed: SourcesUsedEntry[] = [];
  if (questionBlocks.length >= 2) {
    const hydrated = hydrateQuestionBlocks(questionBlocks, knowledge.injectionCandidates);
    questionBlocks = hydrated.blocks;
    sourcesUsed.push(...hydrated.sourcesUsed);
    bodyPlain = ["Dear Guest,", "Thank you for your email. Please find our answers below.", questionBlocks.map((block, index) => `${index + 1}. ${block.label}\n${normalizeParagraphs(block.answer)}`).join("\n\n")].join("\n\n");
  } else {
    const missingCoverage = evaluateQuestionCoverage(bodyPlain, allIntents).filter((entry) => entry.status === "missing");
    const usedCitations = new Set<string>();
    for (const question of missingCoverage.map((entry) => entry.question)) {
      const knowledgeMatch = selectKnowledgeCandidateForQuestion(question, knowledge.injectionCandidates, usedCitations);
      if (!knowledgeMatch) {
        bodyPlain = normalizeParagraphs(`${bodyPlain}\n\n${ESCALATION_FALLBACK_SENTENCE}`);
        continue;
      }
      usedCitations.add(knowledgeMatch.snippet.citation);
      const cleanText = stripCitationMarkers(knowledgeMatch.snippet.text);
      bodyPlain = normalizeParagraphs(`${bodyPlain}\n\n${cleanText}`);
      sourcesUsed.push({ uri: knowledgeMatch.uri, citation: knowledgeMatch.snippet.citation, text: cleanText, score: knowledgeMatch.snippet.score, injected: true });
    }
  }

  const draftGuide = getDraftGuideData();
  const voiceExamples = getVoiceExamplesData();
  const voiceScenario = voiceExamples.scenarios?.[primaryCategory] ?? voiceExamples.scenarios?.faq ?? null;
  const forbiddenPhrases = [
    ...(voiceExamples.global_phrases_to_avoid ?? []),
    ...(voiceScenario?.phrases_to_avoid ?? []),
    ...(voiceScenario?.bad_examples ?? []),
    ...((draftGuide.content_rules?.never ?? []).flatMap((rule) => {
      const lower = rule.toLowerCase();
      if (lower.includes("confirm availability")) return ["availability confirmed"];
      if (lower.includes("charged immediately")) return ["we will charge now", "charged immediately"];
      if (lower.includes("internal notes")) return ["internal note", "internal notes"];
      if (lower.includes("specific service prices")) return ["€15 per bag", "at a cost of eur"];
      return [];
    })),
  ];
  bodyPlain = removeForbiddenPhrases(stripLegacySignatureBlock(bodyPlain), forbiddenPhrases);
  if ((draftGuide.content_rules?.if ?? []).some((rule) => rule.toLowerCase().includes(primaryCategory.toLowerCase()))) {
    const conditional = CONDITIONAL_RULE_SNIPPETS[primaryCategory];
    if (conditional && !includesCaseInsensitive(bodyPlain, conditional)) {
      bodyPlain = normalizeParagraphs(`${bodyPlain}\n\n${conditional}`);
    }
  }
  bodyPlain = policyDecision.mandatoryContent.reduce(
    (current, line) => (includesCaseInsensitive(current, line) ? current : normalizeParagraphs(`${current}\n\n${sentence(line)}`)),
    removeForbiddenPhrases(bodyPlain, policyDecision.prohibitedContent),
  );

  const { body, slots } = personalizeGreeting(stripLegacySignatureBlock(bodyPlain).trim(), input.recipientName);
  if (input.guestRoomNumbers && input.guestRoomNumbers.length > 0) {
    slots.ROOM_NUMBERS = input.guestRoomNumbers.join(", ");
  }
  const slotResolution = resolveSlotsWithParity(body, slots);
  const finalBody = slotResolution.body;
  const bodyHtml = generateEmailHtml({
    recipientName: input.recipientName,
    bodyText: finalBody,
    includeBookingLink: actionPlan.workflow_triggers.booking_action_required,
    subject: input.subject,
  });

  return {
    draftId: crypto.randomUUID(),
    draft: { bodyPlain: finalBody, bodyHtml },
    templateUsed: {
      subject: selectedTemplate?.subject ?? null,
      category: selectedTemplate?.category ?? null,
      confidence: rankResult.confidence,
      selection: questionBlocks.length >= 2 ? "composite" : rankResult.selection,
    },
    questionBlocks: questionBlocks.map((block) => ({
      question: block.question,
      label: block.label,
      answerSource: block.answerSource,
      templateSubject: block.templateSubject,
      templateCategory: block.templateCategory,
      knowledgeCitation: block.knowledgeCitation,
      followUpRequired: block.followUpRequired,
    })),
    knowledgeSources: knowledge.summaries.map((summary) => summary.uri),
    knowledgeSummaries: knowledge.summaries,
    sourcesUsed,
    slotResolution,
    policy: policyDecision,
    deliveryStatus:
      (questionBlocks.length > 0 && questionBlocks.some((block) => block.followUpRequired)) || rankResult.selection === "none"
        ? "needs_follow_up"
        : "ready",
  };
}
