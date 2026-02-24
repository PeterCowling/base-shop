/**
 * Gmail Classification Module
 *
 * Email classification/interpretation pipeline used by organize-inbox
 * and reconciliation to determine how to route emails.
 */

import {
  extractSenderDomain,
  extractSenderEmailAddress,
  isNoReplySender,
} from "./gmail-shared.js";

// =============================================================================
// Classification patterns
// =============================================================================

export const GARBAGE_FROM_PATTERNS = [
  "promotion-it@amazon.it",
  "groupupdates@facebookmail.com",
  "friendsuggestion@facebookmail.com",
  "pageupdates@facebookmail.com",
];

export const GARBAGE_OCTORATE_FROM_PATTERN = "noreply@smtp.octorate.com";
export const GARBAGE_OCTORATE_SUBJECT_PREFIX = "warning - payment process failed";

export const BOOKING_MONITOR_FROM_PATTERNS = [
  "noreply@smtp.octorate.com",
];

export const BOOKING_MONITOR_SUBJECT_PATTERNS = [
  /^new reservation\b/i,
  /^reservation\s+[a-z0-9_-]+\s+confirmed\b/i,
  /^new modification\b/i,
  /^reservation\s+[a-z0-9_-]+\s+has been changed\b/i,
];

export const CANCELLATION_MONITOR_FROM_PATTERNS = [
  "noreply@smtp.octorate.com",
];

export const CANCELLATION_MONITOR_SUBJECT_PATTERNS = [
  /^new cancellation\b/i,
  /^reservation\s+[a-z0-9_-]+\s+cancelled\b/i,
];

export const NON_CUSTOMER_FROM_PATTERNS = [
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
  "italoimpresa@mailing.italotreno.it",
  "cmcowling@me.com",
  "hostelpositano@gmail.com",
];

export const NON_CUSTOMER_SUBJECT_PATTERNS = [
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
];

export const CUSTOMER_SUBJECT_PATTERNS = [
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

export const CUSTOMER_SNIPPET_PATTERNS = [
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

export const SPAM_SUBJECT_PATTERNS = [
  /\byou(?:'|')ve won\b/i,
  /\blottery\b/i,
  /\bbitcoin\b/i,
  /\bcrypto investment\b/i,
  /\burgent transfer\b/i,
  /\bwire transfer\b/i,
  /\baccount suspended\b/i,
];

export const NON_CUSTOMER_DOMAINS = [
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
];

export const CUSTOMER_DOMAIN_EXCEPTIONS = new Set([
  "guest.booking.com",
]);

// =============================================================================
// Classification types and functions
// =============================================================================

export type OrganizeDecision =
  | "needs_processing"
  | "booking_reservation"
  | "cancellation"
  | "promotional"
  | "spam"
  | "deferred"
  | "trash";

export interface OrganizeClassification {
  decision: OrganizeDecision;
  reason: string;
  senderEmail: string;
}

export function shouldTrashAsGarbage(fromRaw: string, subject: string): boolean {
  const fromLower = fromRaw.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (GARBAGE_FROM_PATTERNS.some(pattern => fromLower.includes(pattern))) {
    return true;
  }

  return (
    fromLower.includes(GARBAGE_OCTORATE_FROM_PATTERN) &&
    subjectLower.startsWith(GARBAGE_OCTORATE_SUBJECT_PREFIX)
  );
}

export function classifyOrganizeDecision(
  fromRaw: string,
  subject: string,
  snippet: string,
  hasListUnsubscribeHeader: boolean,
  hasListIdHeader: boolean,
  hasBulkPrecedenceHeader: boolean
): OrganizeClassification {
  const fromLower = fromRaw.toLowerCase();
  const senderEmail = extractSenderEmailAddress(fromRaw);
  const senderDomain = extractSenderDomain(senderEmail);
  const snippetLower = snippet.toLowerCase();

  if (shouldTrashAsGarbage(fromRaw, subject)) {
    return { decision: "trash", reason: "matched-garbage-rule", senderEmail };
  }

  if (SPAM_SUBJECT_PATTERNS.some(pattern => pattern.test(subject))) {
    return { decision: "spam", reason: "matched-spam-pattern", senderEmail };
  }

  const matchesBookingMonitorSender = BOOKING_MONITOR_FROM_PATTERNS.some((pattern) =>
    fromLower.includes(pattern)
  );
  const matchesBookingMonitorSubject = BOOKING_MONITOR_SUBJECT_PATTERNS.some((pattern) =>
    pattern.test(subject)
  );
  if (matchesBookingMonitorSender && matchesBookingMonitorSubject) {
    return { decision: "booking_reservation", reason: "new-reservation-notification", senderEmail };
  }

  const matchesCancellationMonitorSender = CANCELLATION_MONITOR_FROM_PATTERNS.some((pattern) =>
    fromLower.includes(pattern)
  );
  const matchesCancellationMonitorSubject = CANCELLATION_MONITOR_SUBJECT_PATTERNS.some((pattern) =>
    pattern.test(subject)
  );
  if (matchesCancellationMonitorSender && matchesCancellationMonitorSubject) {
    return { decision: "cancellation", reason: "new-cancellation-notification", senderEmail };
  }

  const hasNoReplySender = isNoReplySender(senderEmail);
  const hasNonCustomerFromPattern = NON_CUSTOMER_FROM_PATTERNS.some(pattern =>
    fromLower.includes(pattern)
  );
  const hasNonCustomerSubjectPattern = NON_CUSTOMER_SUBJECT_PATTERNS.some(pattern =>
    pattern.test(subject)
  );
  const hasNonCustomerDomain =
    Boolean(senderDomain) &&
    !CUSTOMER_DOMAIN_EXCEPTIONS.has(senderDomain) &&
    NON_CUSTOMER_DOMAINS.some(
      domain => senderDomain === domain || senderDomain.endsWith(`.${domain}`)
    );
  const hasListSignals =
    hasListUnsubscribeHeader || hasListIdHeader || hasBulkPrecedenceHeader;

  const hasStrongCustomerDomain = CUSTOMER_DOMAIN_EXCEPTIONS.has(senderDomain);
  const hasCustomerSubjectPattern = CUSTOMER_SUBJECT_PATTERNS.some(pattern =>
    pattern.test(subject)
  );
  const hasCustomerSnippetPattern = CUSTOMER_SNIPPET_PATTERNS.some(pattern =>
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
    hasNonCustomerDomain ||
    hasListSignals;

  const hasStrongNonCustomerSignals =
    hasNoReplySender ||
    hasNonCustomerFromPattern ||
    hasNonCustomerDomain ||
    hasListSignals;

  if (hasCustomerSignals && !hasNonCustomerSignals) {
    return { decision: "needs_processing", reason: "customer-signal", senderEmail };
  }

  // Strong machine/OTA/newsletter signals should be routed directly, even if
  // the subject contains booking-related words like "reservation" or "cancellation".
  if (hasStrongNonCustomerSignals && !hasStrongCustomerDomain) {
    return { decision: "promotional", reason: "strong-non-customer-signal", senderEmail };
  }

  if (hasNonCustomerSignals && !hasCustomerSignals) {
    if (
      hasNoReplySender ||
      hasNonCustomerFromPattern ||
      hasNonCustomerSubjectPattern ||
      hasNonCustomerDomain ||
      hasListSignals
    ) {
      return { decision: "promotional", reason: "non-customer-signal", senderEmail };
    }
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

  return { decision: "deferred", reason: "fallback-needs-review", senderEmail };
}
