import {
  type EscalationClassification,
  type ScenarioCategory,
  type ScenarioClassification,
  type ThreadSummary,
} from "./action-plan";

const DOMINANT_CATEGORIES: Set<ScenarioCategory> = new Set(["cancellation", "prepayment"]);

const DEFAULT_HIGH_VALUE_DISPUTE_THRESHOLD_EUR = 500;
const HIGH_VALUE_DISPUTE_THRESHOLD_EUR = (() => {
  const raw = process.env.EMAIL_AUTODRAFT_HIGH_VALUE_DISPUTE_EUR_THRESHOLD;
  if (!raw) {
    return DEFAULT_HIGH_VALUE_DISPUTE_THRESHOLD_EUR;
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HIGH_VALUE_DISPUTE_THRESHOLD_EUR;
  }

  return parsed;
})();

function extractEuroAmounts(text: string): number[] {
  const amounts: number[] = [];
  const normalized = text
    .toLowerCase()
    .replaceAll("€", " € ")
    .replaceAll("eur", " eur ")
    .replace(/[^a-z0-9.,\s€]/gi, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const parseAmount = (token: string | undefined): number | undefined => {
    if (!token) {
      return undefined;
    }

    const cleaned = token.replace(/[^0-9.,]/g, "");
    if (cleaned.length === 0 || !/[0-9]/.test(cleaned)) {
      return undefined;
    }

    const amount = Number.parseFloat(cleaned.replace(",", "."));
    return Number.isFinite(amount) ? amount : undefined;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.length === 1 && token.includes("€")) {
      const amount = parseAmount(tokens[index + 1]);
      if (amount !== undefined) {
        amounts.push(amount);
      }
      continue;
    }

    if (token.length === 3 && token.includes("eur")) {
      const amount = parseAmount(tokens[index - 1]);
      if (amount !== undefined) {
        amounts.push(amount);
      }
      continue;
    }

    if (token.endsWith("€")) {
      const amount = parseAmount(token.slice(0, -1));
      if (amount !== undefined) {
        amounts.push(amount);
      }
    }
  }

  return amounts;
}

export function classifyAllScenarios(text: string): ScenarioClassification[] {
  const lower = text.toLowerCase();
  const rules: Array<{ category: ScenarioCategory; confidence: number; pattern: RegExp }> = [
    {
      category: "prepayment",
      confidence: 0.9,
      pattern: /(prepayment|payment link|secure link|octorate|hostelworld.*payment)/,
    },
    {
      category: "cancellation",
      confidence: 0.88,
      pattern: /(cancel|cancellation|refund|non[-\s]?refundable|no show)/,
    },
    {
      category: "payment",
      confidence: 0.85,
      pattern: /(payment|card|credit card|debit card|bank transfer|invoice|charge|iban)/,
    },
    {
      category: "booking-changes",
      confidence: 0.84,
      pattern: /(change date|date change|booking change|modify booking|reschedul|extend stay|extra night|upgrade|add (one )?more person|add guest)/,
    },
    {
      category: "booking-issues",
      confidence: 0.86,
      pattern: /(check availability|availability.*(from|for).*(to|through)|do you have availability|availability for|available for these dates|available from)/,
    },
    {
      category: "breakfast",
      confidence: 0.84,
      pattern: /(breakfast|meal|morning food|colazione)/,
    },
    {
      category: "luggage",
      confidence: 0.84,
      pattern: /(luggage|bag drop|baggage|suitcase|storage)/,
    },
    {
      category: "wifi",
      confidence: 0.84,
      pattern: /(wi[\s-]?fi|internet|network connection)/,
    },
    {
      category: "transportation",
      confidence: 0.82,
      pattern: /(transport|bus|ferry|taxi|train|airport|how to get)/,
    },
    {
      category: "check-in",
      confidence: 0.8,
      pattern: /(check[-\s]?in|arrival|arrive early|late arrival|out of hours)/,
    },
    {
      category: "checkout",
      confidence: 0.8,
      pattern: /(check[-\s]?out|checkout|departure|late checkout)/,
    },
    {
      category: "house-rules",
      confidence: 0.78,
      pattern: /(house rules|quiet hours|visitor policy|noise policy)/,
    },
    {
      category: "policies",
      confidence: 0.76,
      pattern: /(policy|policies|terms|t&c|age restriction|pet policy|alcohol policy)/,
    },
    {
      category: "access",
      confidence: 0.78,
      pattern: /(main door|access code|entry code|door code|building access)/,
    },
    {
      category: "employment",
      confidence: 0.82,
      pattern: /(job application|employment|volunteer|work exchange|receptionist)/,
    },
    {
      category: "lost-found",
      confidence: 0.8,
      pattern: /(lost item|left behind|forgot|missing item|found item)/,
    },
    {
      category: "promotions",
      confidence: 0.78,
      pattern: /(coupon|discount|promo|promotion|voucher)/,
    },
    {
      category: "activities",
      confidence: 0.8,
      pattern: /(activity|activities|path of the gods|hike|tour|excursion)/,
    },
    {
      category: "booking-issues",
      confidence: 0.74,
      pattern: /(booking issue|reservation issue|why cancelled|booking inquiry|capacity clarification)/,
    },
    {
      category: "faq",
      confidence: 0.7,
      pattern: /(availability|available|price|cost|private room|how much|facilities|services)/,
    },
  ];

  const matched = new Map<ScenarioCategory, number>();
  for (const rule of rules) {
    if (rule.pattern.test(lower)) {
      const existing = matched.get(rule.category);
      if (existing === undefined || rule.confidence > existing) {
        matched.set(rule.category, rule.confidence);
      }
    }
  }

  if (matched.size === 0) {
    return [{ category: "general", confidence: 0.6 }];
  }

  let sorted: ScenarioClassification[] = Array.from(matched.entries())
    .map(([category, confidence]) => ({ category, confidence }))
    .sort((left, right) => right.confidence - left.confidence);

  const dominantIndex = sorted.findIndex((entry) => DOMINANT_CATEGORIES.has(entry.category));
  if (dominantIndex > 0) {
    const [dominant] = sorted.splice(dominantIndex, 1);
    sorted = [dominant, ...sorted];
  }

  return sorted;
}

export function classifyEscalation(
  text: string,
  threadSummary?: ThreadSummary,
): EscalationClassification {
  const lower = text.toLowerCase();
  const highTriggers: string[] = [];
  const criticalTriggers: string[] = [];

  const hasRefundOrCancellation = /(cancel|cancellation|refund)/.test(lower);
  const hasDisputeLanguage =
    /(disput|complaint|unacceptable|issue|problem|chargeback|request (a )?refund|want (a )?refund)/.test(
      lower,
    );
  if (hasRefundOrCancellation && hasDisputeLanguage) {
    highTriggers.push("cancellation_refund_dispute");
  }

  if (
    /(chargeback|card dispute|dispute (the |this )?charge|reverse (the |this )?charge|bank dispute)/.test(
      lower,
    )
  ) {
    highTriggers.push("chargeback_hint");
  }

  if (/(medical|hospital|emergency|disability|pregnan|bereave|funeral|vulnerable)/.test(lower)) {
    highTriggers.push("vulnerable_circumstance");
  }

  const hasComplaintTone =
    /(still waiting|no response|unanswered|ignored|unacceptable|frustrated|upset|complaint|complain|again|already)/.test(
      lower,
    );
  if ((threadSummary?.previous_response_count ?? 0) >= 3 && hasComplaintTone) {
    highTriggers.push("repeated_complaint");
  }

  if (/(lawyer|attorney|legal action|lawsuit|sue|court|solicitor|small claims)/.test(lower)) {
    criticalTriggers.push("legal_threat");
  }

  const hasPlatformMention =
    /(booking\.com|airbnb|expedia|tripadvisor|google review|regulator|consumer authority|ombudsman)/.test(
      lower,
    );
  const hasEscalationVerb = /(contact|report|complain|complaint|escalate|open case|file)/.test(lower);
  if (hasPlatformMention && hasEscalationVerb) {
    criticalTriggers.push("platform_escalation_threat");
  }

  const hasPublicThreat =
    /(social media|instagram|facebook|tiktok|twitter|x\.com|press|media|public review|go public|viral)/.test(
      lower,
    );
  const hasPublicThreatVerb = /(post|publish|share|report|expose|name and shame|contact)/.test(lower);
  if (hasPublicThreat && hasPublicThreatVerb) {
    criticalTriggers.push("public_media_threat");
  }

  if (/(fraud|scam|theft|stole|criminal|misconduct|dishonest|illegal charge)/.test(lower)) {
    criticalTriggers.push("fraud_or_misconduct_accusation");
  }

  const amounts = extractEuroAmounts(lower);
  const hasHighValueDispute = amounts.some(
    (amount) => amount >= HIGH_VALUE_DISPUTE_THRESHOLD_EUR,
  );
  const hasDisputeContext = /(refund|dispute|chargeback|cancel|cancellation|complaint|legal)/.test(
    lower,
  );
  if (hasHighValueDispute && hasDisputeContext) {
    criticalTriggers.push("high_value_dispute");
  }

  const uniqueTriggers = Array.from(new Set([...criticalTriggers, ...highTriggers]));

  if (criticalTriggers.length > 0) {
    const confidence = Math.min(0.99, 0.86 + (criticalTriggers.length - 1) * 0.04);
    return {
      tier: "CRITICAL",
      triggers: uniqueTriggers,
      confidence: Number(confidence.toFixed(2)),
    };
  }

  if (highTriggers.length > 0) {
    const confidence = Math.min(0.95, 0.74 + (highTriggers.length - 1) * 0.06);
    return {
      tier: "HIGH",
      triggers: uniqueTriggers,
      confidence: Number(confidence.toFixed(2)),
    };
  }

  return {
    tier: "NONE",
    triggers: [],
    confidence: 0,
  };
}
