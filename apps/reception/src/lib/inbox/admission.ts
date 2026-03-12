import "server-only";

export const garbageFromPatterns = [
  "promotion-it@amazon.it",
  "groupupdates@facebookmail.com",
  "friendsuggestion@facebookmail.com",
  "pageupdates@facebookmail.com",
] as const;

export const garbageOctorateFromPattern = "noreply@smtp.octorate.com";
export const garbageOctorateSubjectPrefix = "warning - payment process failed";

export const bookingMonitorFromPatterns = [
  "noreply@smtp.octorate.com",
] as const;

export const bookingMonitorSubjectPatterns = [
  /^new reservation\b/i,
  /^reservation\s+[a-z0-9_-]+\s+confirmed\b/i,
  /^new modification\b/i,
  /^reservation\s+[a-z0-9_-]+\s+has been changed\b/i,
];

export const cancellationMonitorFromPatterns = [
  "noreply@smtp.octorate.com",
] as const;

export const cancellationMonitorSubjectPatterns = [
  /^new cancellation\b/i,
  /^reservation\s+[a-z0-9_-]+\s+cancelled\b/i,
];

export const nonCustomerFromPatterns = [
  "noreply@booking.com",
  "no-reply@booking.com",
  "noreply@hotels.com",
  "noreply@expedia.com",
  "noreply@agoda.com",
  "noreply@airbnb.com",
  "noreply@hostelworld.com",
  "mailer-daemon@",
  "postmaster@",
  "noreply@smtp.octorate.com",
  "noreply-apps-scripts-notifications@google.com",
  "cloudplatform-noreply@google.com",
  "maps-noreply@google.com",
  "noreply-local@google.com",
  "italoimpresa@mailing.italotreno.it",
  "infopoint@distrettocostadamalfi.it",
  "ikea@news.email.ikea.it",
  "cmcowling@me.com",
  "hostelpositano@gmail.com",
] as const;

export const nonCustomerSubjectPatterns = [
  /^(re:|fwd:)?\s*booking confirmation/i,
  /^(re:|fwd:)?\s*reservation confirmed/i,
  /^(re:|fwd:)?\s*your booking/i,
  /^(re:|fwd:)?\s*payment received/i,
  /^(re:|fwd:)?\s*invoice/i,
  /^(re:|fwd:)?\s*receipt/i,
  /newsletter/i,
  /unsubscribe/i,
  /^(re:|fwd:)?\s*out of office/i,
  /^(re:|fwd:)?\s*automatic reply/i,
  /delivery status notification/i,
  /^returned mail/i,
  /new reservation/i,
  /new cancellation/i,
  /hostelworld confirmed booking/i,
  /^screenshot\s+\d{4}-\d{2}-\d{2}/i,
  /\bjob application\b/i,
  /\bterms of service\b/i,
  /\bprivacy policy\b/i,
  /\bannual report\b/i,
  /\bfattura\b/i,
  /\bcashback\b/i,
  /\bofferta\b/i,
  /\bsconto\b/i,
  /\bpromozione\b/i,
  /\brisparmia\b/i,
  /\bprotect yourself now\b/i,
  /\bproteggiti ora\b/i,
  /\bproteggiti\b/i,
  /\binfestanti\b/i,
  /\bdisinfestazione\b/i,
  /\bleft a review\b/i,
  /\bnew review\b/i,
  /\bseo\b/i,
  /\bwebsite traffic\b/i,
  /\brank higher\b/i,
  /\battract more customers\b/i,
  /\binfluencer\b/i,
  /\bcontent creator\b/i,
  /\btravel guide\b/i,
  /\byoutube channel\b/i,
  /^a customer saved their research$/i,
];

export const nonCustomerSnippetPatterns = [
  /\bincrease your website traffic\b/i,
  /\bour seo strateg(?:y|ies)\b/i,
  /\brank higher\b/i,
  /\battract more customers\b/i,
  /\bfree stay\b/i,
  /\bcomplimentary stay\b/i,
  /\bin exchange for\b/i,
  /\bfeature (?:you|your hostel|your property)\b/i,
  /\bfeature us on\b/i,
  /\btravel guide\b/i,
  /\byoutube channel\b/i,
  /\bblog\/website\b/i,
  /\binfluencer\b/i,
  /\bcontent creator\b/i,
  /\bcollaborat(?:e|ion)\b/i,
  /\bseo strateg(?:y|ies)\b/i,
  /\bwebsite traffic\b/i,
];

export const customerSubjectPatterns = [
  /your hostel brikette reservation/i,
  /\bavailability\b/i,
  /\bbooking\b/i,
  /\breservation\b/i,
  /\bcheck[\s-]?in\b/i,
  /\bcheck[\s-]?out\b/i,
  /\barriv(?:e|al)\b/i,
  /\bcancel(?:lation)?\b/i,
  /\brefund\b/i,
  /\bpayment\b/i,
  /\bquestion\b/i,
];

export const customerSnippetPatterns = [
  /\bavailability\b/i,
  /\bbooking\b/i,
  /\breservation\b/i,
  /\bcheck[\s-]?in\b/i,
  /\bcheck[\s-]?out\b/i,
  /\barriv(?:e|al)\b/i,
  /\bcancel(?:lation)?\b/i,
  /\brefund\b/i,
  /\bluggage\b/i,
  /\bbreakfast\b/i,
  /\bwi[\s-]?fi\b/i,
  /\bquestion\b/i,
];

export const spamSubjectPatterns = [
  /\byou(?:'|')ve won\b/i,
  /\blottery\b/i,
  /\bbitcoin\b/i,
  /\bcrypto investment\b/i,
  /\burgent transfer\b/i,
  /\bwire transfer\b/i,
  /\baccount suspended\b/i,
];

export const nonCustomerDomains = [
  "booking.com",
  "properties.booking.com",
  "expedia.com",
  "expediagroup.com",
  "expediapartnercentral.com",
  "hotels.com",
  "agoda.com",
  "hostelworld.com",
  "tripadvisor.com",
  "kayak.com",
  "trivago.com",
  "mailchimp.com",
  "sendgrid.net",
  "amazonses.com",
  "smtp.octorate.com",
  "marketing.octorate.com",
  "accounts.google.com",
  "mailing.italotreno.it",
  "revolut.com",
  "nordaccount.com",
  "ausino.it",
] as const;

export const customerDomainExceptions = new Set<string>([
  "guest.booking.com",
]);

export type OrganizeDecision =
  | "needs_processing"
  | "booking_reservation"
  | "cancellation"
  | "promotional"
  | "spam"
  | "deferred"
  | "trash";

export type AdmissionOutcome = "admit" | "auto-archive" | "review-later";

export type EmailMetadata = {
  fromRaw?: string | null;
  subject?: string | null;
  snippet?: string | null;
  hasListUnsubscribeHeader?: boolean;
  hasListIdHeader?: boolean;
  hasBulkPrecedenceHeader?: boolean;
};

export type AdmissionDecision = {
  outcome: AdmissionOutcome;
  reason: string;
  senderEmail: string;
  organizeDecision: OrganizeDecision;
};

function parseEmailAddress(value: string): { name: string; email: string } {
  const angleMatch = value.match(/<([^>]+)>/);
  if (angleMatch) {
    const email = angleMatch[1].trim();
    const name = value.replace(/<[^>]+>/, "").replace(/"/g, "").trim();
    return {
      name: name || email,
      email,
    };
  }

  const trimmed = value.trim();
  return { name: trimmed, email: trimmed };
}

function extractSenderEmailAddress(fromRaw: string): string {
  const parsed = parseEmailAddress(fromRaw);
  return parsed.email.toLowerCase();
}

export function extractSenderDomain(emailAddress: string): string {
  const atIndex = emailAddress.lastIndexOf("@");
  if (atIndex < 0) {
    return "";
  }
  return emailAddress.slice(atIndex + 1);
}

function isNoReplySender(emailAddress: string): boolean {
  const atIndex = emailAddress.lastIndexOf("@");
  const localPart = (atIndex >= 0 ? emailAddress.slice(0, atIndex) : emailAddress).toLowerCase();
  return /^(no[-_.]?reply|noreply|do[-_.]?not[-_.]?reply|donotreply)$/.test(localPart);
}

export function shouldTrashAsGarbage(fromRaw: string, subject: string): boolean {
  const fromLower = fromRaw.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (garbageFromPatterns.some((pattern) => fromLower.includes(pattern))) {
    return true;
  }

  return (
    fromLower.includes(garbageOctorateFromPattern) &&
    subjectLower.startsWith(garbageOctorateSubjectPrefix)
  );
}

export function classifyOrganizeDecision(email: EmailMetadata): {
  decision: OrganizeDecision;
  reason: string;
  senderEmail: string;
} {
  const fromRaw = (email.fromRaw ?? "").trim();
  const subject = (email.subject ?? "").trim();
  const snippet = (email.snippet ?? "").trim();
  const senderEmail = extractSenderEmailAddress(fromRaw);
  const senderDomain = extractSenderDomain(senderEmail);
  const fromLower = fromRaw.toLowerCase();
  const snippetLower = snippet.toLowerCase();

  if (!fromRaw && !subject && !snippet) {
    return {
      decision: "deferred",
      reason: "low-confidence-needs-review",
      senderEmail,
    };
  }

  if (shouldTrashAsGarbage(fromRaw, subject)) {
    return { decision: "trash", reason: "matched-garbage-rule", senderEmail };
  }

  if (spamSubjectPatterns.some((pattern) => pattern.test(subject))) {
    return { decision: "spam", reason: "matched-spam-pattern", senderEmail };
  }

  const matchesBookingMonitorSender = bookingMonitorFromPatterns.some((pattern) =>
    fromLower.includes(pattern)
  );
  const matchesBookingMonitorSubject = bookingMonitorSubjectPatterns.some((pattern) =>
    pattern.test(subject)
  );
  if (matchesBookingMonitorSender && matchesBookingMonitorSubject) {
    return { decision: "booking_reservation", reason: "new-reservation-notification", senderEmail };
  }

  const matchesCancellationMonitorSender = cancellationMonitorFromPatterns.some((pattern) =>
    fromLower.includes(pattern)
  );
  const matchesCancellationMonitorSubject = cancellationMonitorSubjectPatterns.some((pattern) =>
    pattern.test(subject)
  );
  if (matchesCancellationMonitorSender && matchesCancellationMonitorSubject) {
    return { decision: "cancellation", reason: "new-cancellation-notification", senderEmail };
  }

  const hasNoReplySender = isNoReplySender(senderEmail);
  const hasNonCustomerFromPattern = nonCustomerFromPatterns.some((pattern) =>
    fromLower.includes(pattern)
  );
  const hasNonCustomerSubjectPattern = nonCustomerSubjectPatterns.some((pattern) =>
    pattern.test(subject)
  );
  const hasNonCustomerSnippetPattern = nonCustomerSnippetPatterns.some((pattern) =>
    pattern.test(snippetLower)
  );
  const hasNonCustomerDomain =
    Boolean(senderDomain) &&
    !customerDomainExceptions.has(senderDomain) &&
    nonCustomerDomains.some(
      (domain) => senderDomain === domain || senderDomain.endsWith(`.${domain}`)
    );
  const hasListSignals = Boolean(
    email.hasListUnsubscribeHeader || email.hasListIdHeader || email.hasBulkPrecedenceHeader
  );

  const hasStrongCustomerDomain = customerDomainExceptions.has(senderDomain);
  const hasCustomerSubjectPattern = customerSubjectPatterns.some((pattern) =>
    pattern.test(subject)
  );
  const hasCustomerSnippetPattern = customerSnippetPatterns.some((pattern) =>
    pattern.test(snippetLower)
  );
  const hasQuestionSignal = subject.includes("?") || snippet.includes("?");
  const hasCustomerSignals =
    hasStrongCustomerDomain ||
    hasCustomerSubjectPattern ||
    hasCustomerSnippetPattern ||
    hasQuestionSignal;

  const hasNonCustomerSignals =
    hasNoReplySender ||
    hasNonCustomerFromPattern ||
    hasNonCustomerSubjectPattern ||
    hasNonCustomerSnippetPattern ||
    hasNonCustomerDomain ||
    hasListSignals;

  const hasStrongNonCustomerSignals =
    hasNoReplySender ||
    hasNonCustomerFromPattern ||
    hasNonCustomerSnippetPattern ||
    hasNonCustomerDomain ||
    hasListSignals;

  if (hasCustomerSignals && !hasNonCustomerSignals) {
    return { decision: "needs_processing", reason: "customer-signal", senderEmail };
  }

  if (hasStrongNonCustomerSignals && !hasStrongCustomerDomain) {
    return { decision: "promotional", reason: "strong-non-customer-signal", senderEmail };
  }

  if (hasNonCustomerSignals && !hasCustomerSignals) {
    return { decision: "promotional", reason: "non-customer-signal", senderEmail };
  }

  if (hasCustomerSignals && hasNonCustomerSignals) {
    return {
      decision: "deferred",
      reason: "mixed-signals-needs-review",
      senderEmail,
    };
  }

  if (!hasCustomerSignals && !hasNonCustomerSignals) {
    return {
      decision: "deferred",
      reason: "low-confidence-needs-review",
      senderEmail,
    };
  }

  return {
    decision: "deferred",
    reason: "fallback-needs-review",
    senderEmail,
  };
}

function mapOrganizeDecisionToAdmissionOutcome(
  decision: OrganizeDecision,
): AdmissionOutcome {
  switch (decision) {
    case "needs_processing":
      return "admit";
    case "promotional":
    case "spam":
    case "trash":
    case "booking_reservation":
    case "cancellation":
      return "auto-archive";
    case "deferred":
    default:
      return "review-later";
  }
}

export function classifyForAdmission(email: EmailMetadata): AdmissionDecision {
  const organize = classifyOrganizeDecision(email);
  return {
    outcome: mapOrganizeDecisionToAdmissionOutcome(organize.decision),
    reason: organize.reason,
    senderEmail: organize.senderEmail,
    organizeDecision: organize.decision,
  };
}
