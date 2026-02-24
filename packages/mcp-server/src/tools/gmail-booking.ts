/**
 * Gmail Booking Module
 *
 * Booking reservation processing including parsing new reservation
 * notifications, building draft replies, and duplicate checking.
 */

import type { gmail_v1 } from "googleapis";

import { createRawEmail } from "../utils/email-mime.js";
import { generateEmailHtml } from "../utils/email-template.js";

import {
  appendAuditEntry,
  extractBody,
  LABELS,
  normalizeWhitespace,
} from "./gmail-shared.js";
import { processCancellationEmail } from "./process-cancellation-email.js";

// =============================================================================
// Constants
// =============================================================================

const TERMS_AND_CONDITIONS_URL =
  "https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing";

// =============================================================================
// Types
// =============================================================================

export interface BookingReservationDetails {
  reservationCode: string;
  guestEmail: string;
  guestName?: string;
  checkInDate?: string;
  nights?: number;
  totalPrice?: string;
  nonRefundable: boolean;
  paymentTerms: string;
  bookingSource: string;
  roomSummary?: string;
  roomNumbers?: number[];
}

export interface BookingReservationSample {
  threadId: string;
  messageId: string;
  subject: string;
  from: string;
  guestEmail: string;
  draftId?: string;
}

export interface DeferredSample {
  threadId: string;
  messageId: string;
  subject: string;
  from: string;
  senderEmail: string;
  reason: string;
}

// =============================================================================
// Parsing utilities
// =============================================================================

function normalizeReservationCode(raw: string): string {
  const cleaned = normalizeWhitespace(raw);
  if (!cleaned) return "";
  const [firstChunk] = cleaned.split("_");
  return firstChunk.trim();
}

function extractFirstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    for (let index = 1; index < match.length; index += 1) {
      const candidate = normalizeWhitespace(match[index] ?? "");
      if (candidate) return candidate;
    }
  }
  return "";
}

function parseFlexibleDate(rawDate: string): string {
  const value = normalizeWhitespace(rawDate);
  if (!value) return "";

  const ymd = value.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    const year = Number.parseInt(ymd[1], 10);
    const month = Number.parseInt(ymd[2], 10);
    const day = Number.parseInt(ymd[3], 10);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  const dmy = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmy) {
    const day = Number.parseInt(dmy[1], 10);
    const month = Number.parseInt(dmy[2], 10);
    let year = Number.parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function parsePrice(rawPrice: string): string {
  const value = normalizeWhitespace(rawPrice);
  const match = value.match(/([\d.,]+)/);
  if (!match) return "";

  let normalized = match[1];
  if (normalized.includes(".") && normalized.includes(",")) {
    if (normalized.lastIndexOf(".") > normalized.lastIndexOf(",")) {
      normalized = normalized.replace(/,/g, "");
    } else {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    }
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const number = Number.parseFloat(normalized);
  if (!Number.isFinite(number)) return "";
  return number.toFixed(2);
}

function deriveBookingSource(reservationCode: string): string {
  if (reservationCode.length === 10) return "Booking.com";
  if (reservationCode.length === 6) return "Hostel Brikette's Website";
  return "Hostelworld";
}

function derivePaymentTerms(reservationCode: string, nonRefundable: boolean): string {
  const isBookingDotCom = reservationCode.length === 10;
  if (nonRefundable) {
    return "Your booking is pre-paid and non-refundable.";
  }
  if (isBookingDotCom) {
    return "Your reservation is refundable according to the terms of your booking. Payment can be made before or during check-in.";
  }
  return "Payment is due upon arrival at the hostel.";
}

function extractGuestEmail(combined: string): string {
  const candidates = Array.from(
    new Set(
      (combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g) || [])
        .map(email => email.toLowerCase())
    )
  );
  return candidates.find((email) =>
    !email.includes("smtp.octorate.com") &&
    !email.includes("booking.com") &&
    !email.includes("hostelworld.com")
  ) || "";
}

function computeNights(checkInDate: string, checkOutDate: string): number | undefined {
  if (!checkInDate || !checkOutDate) return undefined;
  const start = new Date(`${checkInDate}T00:00:00Z`);
  const end = new Date(`${checkOutDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays > 0 ? diffDays : undefined;
}

function applyHostelworldCommission(totalPrice: string, reservationCode: string): string {
  if (!reservationCode.startsWith("7763-")) return totalPrice;

  const total = Number.parseFloat(totalPrice);
  if (!Number.isFinite(total) || total <= 0) return totalPrice;

  const adjusted = total - ((total / 1.1) * 0.15);
  return adjusted.toFixed(2);
}

function formatLongDate(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;

  const day = date.getUTCDate();
  const suffix = (day >= 11 && day <= 13)
    ? "th"
    : (day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th");
  const month = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const year = date.getUTCFullYear();
  return `${day}${suffix} of ${month}, ${year}`;
}

function extractRoomNumbers(text: string): number[] {
  const matches = Array.from(text.matchAll(/\broom\s*#?\s*(\d{1,2})\b/gi));
  const numbers = matches
    .map(match => Number.parseInt(match[1] || "", 10))
    .filter(number => Number.isFinite(number));
  return Array.from(new Set(numbers));
}

function getRoomDescription(roomNumber: number): string {
  if (roomNumber === 3 || roomNumber === 4) {
    return "Value dorm, with air conditioning, and external shared restrooms.";
  }
  if (roomNumber === 5 || roomNumber === 6) {
    return "Superior dorm, with air conditioning and restroom";
  }
  if (roomNumber === 7) {
    return "Double room, private, with air conditioning and sea view terrace";
  }
  if (roomNumber === 8) {
    return "Garden view dorm, with air conditioning and shared bathroom.";
  }
  if (roomNumber === 9 || roomNumber === 10) {
    return "Premium dorm, with air conditioning and restroom";
  }
  if (roomNumber === 11 || roomNumber === 12) {
    return "Superior dorm, with air conditioning and restroom";
  }
  return "Room details not available";
}

function getBedDescription(roomNumber: number): string {
  if (roomNumber === 3 || roomNumber === 4) {
    return "Four bunk beds, for a total of eight beds";
  }
  if (roomNumber === 5) {
    return "Three bunk beds, for a total of six beds";
  }
  if (roomNumber === 6) {
    return "Three bunk beds, plus one single bed, for a total of seven beds.";
  }
  if (roomNumber === 7) {
    return "One double bed.";
  }
  if (roomNumber === 8) {
    return "One bunk bed, for a total of two beds.";
  }
  if (roomNumber === 9) {
    return "3 beds.";
  }
  if (roomNumber === 10 || roomNumber === 11 || roomNumber === 12) {
    return "3 bunk beds, for a total of 6 beds.";
  }
  return "Bed details not available";
}

function getRoomView(roomNumber: number): string {
  if (roomNumber === 3 || roomNumber === 4 || roomNumber === 9 || roomNumber === 10) {
    return "No view";
  }
  if (roomNumber === 5 || roomNumber === 6 || roomNumber === 7) {
    return "Sea view, with terrace";
  }
  if (roomNumber === 8) {
    return "Garden view";
  }
  if (roomNumber === 11 || roomNumber === 12) {
    return "Oversized sea view terrace";
  }
  return "No view available";
}

// =============================================================================
// Parsing and draft building
// =============================================================================

export function parseNewReservationNotification(
  subject: string,
  plainBody: string,
  htmlBody?: string
): BookingReservationDetails | null {
  const combined = [subject, plainBody, htmlBody ?? ""].join("\n");
  const reservationCode = normalizeReservationCode(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*reservation code\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
      /\bnew reservation\s+([A-Za-z0-9_-]+)/i,
    ])
  );

  const guestName = extractFirstMatch(combined, [
    /<td[^>]*>\s*(?:<b>)?\s*guest name\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
  ]);
  const guestEmail = extractFirstMatch(combined, [
    /<td[^>]*>\s*email\s*<\/td>\s*<td[^>]*>\s*<a[^>]*?href="mailto:([^"]+)"[^>]*>[^<]*<\/a>\s*<\/td>/i,
    /<td[^>]*>\s*email\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
  ]) || extractGuestEmail(combined);

  const checkInFromBody = parseFlexibleDate(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*check\s*[-]?\s*in\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
    ])
  );
  const subjectDateMatch = subject.match(
    /\bbooking\s+(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/i
  );
  const checkInDate = checkInFromBody || (subjectDateMatch?.[1] ?? "");
  const checkOutDateFromSubject = subjectDateMatch?.[2] ?? "";

  const nightsFromBody = Number.parseInt(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*nights\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
    ]),
    10
  );

  const nightsFromDates = computeNights(checkInDate, checkOutDateFromSubject);
  const nights = Number.isFinite(nightsFromBody) && nightsFromBody > 0
    ? nightsFromBody
    : nightsFromDates;

  const baseTotalPrice = parsePrice(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*total amount\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      /<td[^>]*>\s*(?:<b>)?\s*total to be cashed\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      /<td[^>]*>\s*(?:<b>)?\s*total net\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
    ])
  );
  const totalPrice = applyHostelworldCommission(baseTotalPrice, reservationCode);

  const roomMatches = Array.from(
    combined.matchAll(/<td[^>]*><b>\s*([^<]*room[^<]*)\s*<\/b><\/td>\s*<td[^>]*>([^<]*)<\/td>/gi)
  );
  const roomSummary = roomMatches
    .map((match) => `${normalizeWhitespace(match[1] ?? "")} - ${normalizeWhitespace(match[2] ?? "")}`)
    .filter(Boolean)
    .join(" | ");
  const roomNumbers = extractRoomNumbers(`${roomSummary} ${combined}`);

  if (!guestEmail) {
    return null;
  }

  const nonRefundable = /non\s*[-]?\s*refund/i.test(combined);
  const bookingSource = deriveBookingSource(reservationCode);
  const paymentTerms = derivePaymentTerms(reservationCode, nonRefundable);

  return {
    reservationCode,
    guestEmail,
    guestName,
    checkInDate: checkInDate || undefined,
    nights: nights || undefined,
    totalPrice: totalPrice || undefined,
    nonRefundable,
    paymentTerms,
    bookingSource,
    roomSummary: roomSummary || undefined,
    roomNumbers: roomNumbers.length > 0 ? roomNumbers : undefined,
  };
}

export function buildNewReservationDraft(details: BookingReservationDetails): {
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
} {
  const guestName = (details.guestName || "Guest").trim();
  const checkIn = details.checkInDate ? formatLongDate(details.checkInDate) : "";
  const numberOfGuests = 1;
  const nights = details.nights ?? 1;
  const totalPrice = details.totalPrice ?? "";
  const roomNumbers = details.roomNumbers ?? [];

  const summaryLines: string[] = [
    `Dear ${guestName},`,
    "",
    "Thank you for choosing to stay with us. Below is some essential information.",
    "",
  ];

  if (details.nonRefundable && details.reservationCode.length !== 10) {
    summaryLines.push(
      "ACTION REQUIRED",
      "Please reply with \"Agree\" within 48 hours.",
      "If we do not receive agreement within this time, we won't be able to hold your booking.",
      "Replying agree confirms your agreement with our terms and conditions for room bookings:",
      `(${TERMS_AND_CONDITIONS_URL})`,
      "and enables us to process payment for your room.",
      "Thanks!",
      ""
    );
  }

  summaryLines.push(
    "HERE ARE YOUR RESERVATION DETAILS:",
    `Source: ${details.bookingSource}`,
    `Reservation Code: ${details.reservationCode}`
  );

  if (checkIn) {
    summaryLines.push(`Check-in: ${checkIn}`);
  }

  summaryLines.push(
    `Number of Guests: ${numberOfGuests}`,
    `Nights: ${nights}`,
    `Amount due for room: \u20AC${totalPrice}`,
    `Payment terms for room: ${details.paymentTerms}`,
    "City Tax Due: Positano has a City Tax of \u20AC2.50 per guest, per night. Must be paid in euros as cash.",
    "Key Deposits: A \u20AC10 keycard deposit (per keycard) is required at check-in. Paid in euros as cash.",
    ""
  );

  if (roomNumbers.length > 0) {
    const heading = roomNumbers.length === 1 ? "ROOM" : "ROOMS";
    summaryLines.push(heading);

    for (const roomNumber of roomNumbers) {
      const description = getRoomDescription(roomNumber);
      const beds = getBedDescription(roomNumber);
      const view = getRoomView(roomNumber);
      const commaIndex = description.indexOf(",");
      const roomType = commaIndex > 0 ? description.slice(0, commaIndex).trim() : description;
      const facilities = commaIndex > 0 ? description.slice(commaIndex + 1).trim() : "";

      summaryLines.push(
        "",
        `-- Details for Room #${roomNumber} --`,
        `Room number: ${roomNumber}`,
        `Room type: ${roomType}`,
        `Facilities: ${facilities}`,
        `Beds: ${beds}`,
        `View: ${view}`
      );
    }
    summaryLines.push("");
  }

  const bodyPlain = summaryLines.join("\n");
  const subject = "Your Hostel Brikette Reservation";
  const recipientName = guestName;
  const bodyHtml = generateEmailHtml({
    recipientName,
    bodyText: bodyPlain,
    includeBookingLink: false,
    subject,
  });

  return { subject, bodyPlain, bodyHtml };
}

// ---------------------------------------------------------------------------
// Booking-ref dedup: prevent duplicate drafts for the same reservation code
// ---------------------------------------------------------------------------

/**
 * Check whether a draft already exists for a given reservation code.
 *
 * Searches recent Gmail drafts (last 24 h) for a matching reservation code
 * in the draft body or subject. Returns `{ isDuplicate: true }` when a match
 * is found, signalling that draft creation should be skipped.
 *
 * **Fail-open:** If the reservation code is empty or the Gmail API call
 * throws, the function returns `{ isDuplicate: false }` so that existing
 * behaviour is preserved.
 */
export async function checkBookingRefDuplicate(
  gmail: gmail_v1.Gmail,
  reservationCode: string,
): Promise<{ isDuplicate: boolean }> {
  // Fail-open: empty reservation code -> proceed normally
  if (!reservationCode) {
    return { isDuplicate: false };
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const afterEpoch = Math.floor(oneDayAgo.getTime() / 1000);

    const response = await gmail.users.drafts.list({
      userId: "me",
      q: `"Reservation Code: ${reservationCode}" after:${afterEpoch}`,
      maxResults: 1,
    });

    const drafts = response.data.drafts ?? [];
    return { isDuplicate: drafts.length > 0 };
  } catch {
    // Fail-open: API error -> proceed with draft creation
    return { isDuplicate: false };
  }
}

export async function processBookingReservationNotification({
  gmail,
  messageId,
  threadId,
  subject,
  fromRaw,
  senderEmail,
  dryRun,
  deferredLabelId,
  processedDraftedLabelId,
}: {
  gmail: gmail_v1.Gmail;
  messageId: string;
  threadId: string;
  subject: string;
  fromRaw: string;
  senderEmail: string;
  dryRun: boolean;
  deferredLabelId?: string;
  processedDraftedLabelId?: string;
}): Promise<
  | { status: "processed"; sample: BookingReservationSample }
  | { status: "deferred"; sample: DeferredSample }
> {
  const fullMessage = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  const extractedBody = extractBody(
    fullMessage.data.payload as Parameters<typeof extractBody>[0]
  );
  const reservation = parseNewReservationNotification(
    subject,
    extractedBody.plain,
    extractedBody.html
  );

  if (!reservation) {
    if (!dryRun) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: deferredLabelId ? [deferredLabelId] : [],
          removeLabelIds: ["INBOX"],
        },
      });
    }

    return {
      status: "deferred",
      sample: {
        threadId,
        messageId,
        subject,
        from: fromRaw,
        senderEmail,
        reason: "new-reservation-parse-failed",
      },
    };
  }

  // Booking-ref dedup: skip draft if one already exists for this reservation code
  if (!dryRun && reservation.reservationCode) {
    const { isDuplicate } = await checkBookingRefDuplicate(gmail, reservation.reservationCode);
    if (isDuplicate) {
      appendAuditEntry({
        ts: new Date().toISOString(),
        messageId,
        action: "booking-dedup-skipped",
        actor: "system",
        result: `duplicate-reservation-code:${reservation.reservationCode}`,
      });

      // Still label the message as processed (remove from inbox)
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: processedDraftedLabelId ? [processedDraftedLabelId] : [],
          removeLabelIds: ["INBOX", "UNREAD"],
        },
      });

      return {
        status: "processed",
        sample: {
          threadId,
          messageId,
          subject,
          from: fromRaw,
          guestEmail: reservation.guestEmail,
          draftId: undefined, // No draft created (dedup)
        },
      };
    }
  }

  const bookingDraft = buildNewReservationDraft(reservation);
  let createdDraftId: string | undefined;
  if (!dryRun) {
    const raw = createRawEmail(
      reservation.guestEmail,
      bookingDraft.subject,
      bookingDraft.bodyPlain,
      bookingDraft.bodyHtml
    );
    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: { raw },
      },
    });
    createdDraftId = draft.data.id ?? undefined;

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: processedDraftedLabelId ? [processedDraftedLabelId] : [],
        removeLabelIds: ["INBOX", "UNREAD"],
      },
    });
  }

  return {
    status: "processed",
    sample: {
      threadId,
      messageId,
      subject,
      from: fromRaw,
      guestEmail: reservation.guestEmail,
      draftId: createdDraftId,
    },
  };
}

/**
 * Handle cancellation email processing.
 * Extracts the cancellation workflow logic from the main organize inbox switch case.
 */
export async function handleCancellationCase({
  gmail,
  labelMap,
  latestMessage,
  dryRun,
  fromRaw,
}: {
  gmail: gmail_v1.Gmail;
  labelMap: Map<string, string>;
  latestMessage: gmail_v1.Schema$Message;
  dryRun: boolean;
  fromRaw: string;
}): Promise<{ processed: boolean }> {
  const cancellationReceivedLabelId = labelMap.get(LABELS.WORKFLOW_CANCELLATION_RECEIVED);
  const cancellationProcessedLabelId = labelMap.get(LABELS.WORKFLOW_CANCELLATION_PROCESSED);
  const cancellationParseFailedLabelId = labelMap.get(LABELS.WORKFLOW_CANCELLATION_PARSE_FAILED);
  const cancellationBookingNotFoundLabelId = labelMap.get(
    LABELS.WORKFLOW_CANCELLATION_BOOKING_NOT_FOUND
  );

  if (!cancellationReceivedLabelId) {
    throw new Error(`Missing required label: ${LABELS.WORKFLOW_CANCELLATION_RECEIVED}`);
  }

  // Apply Cancellation-Received label immediately
  if (!dryRun) {
    await gmail.users.messages.modify({
      userId: "me",
      id: latestMessage.id!,
      requestBody: {
        addLabelIds: [cancellationReceivedLabelId],
        removeLabelIds: [],
      },
    });
  }

  // Extract email body for processing
  const extractedBody = extractBody(latestMessage.payload as Parameters<typeof extractBody>[0]);
  const emailHtml = extractedBody.html || extractedBody.plain;

  // Invoke processCancellationEmail tool (mock in tests, real in production)
  const firebaseUrl = process.env.FIREBASE_DATABASE_URL || "";
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  try {
    const result = await processCancellationEmail(
      latestMessage.id!,
      emailHtml,
      fromRaw,
      firebaseUrl,
      firebaseApiKey
    );

    // Apply status-specific label based on tool result
    let statusLabelId: string | undefined;
    if (result.status === "success" && cancellationProcessedLabelId) {
      statusLabelId = cancellationProcessedLabelId;
    } else if (result.status === "parse-failed" && cancellationParseFailedLabelId) {
      statusLabelId = cancellationParseFailedLabelId;
    } else if (result.status === "booking-not-found" && cancellationBookingNotFoundLabelId) {
      statusLabelId = cancellationBookingNotFoundLabelId;
    }

    if (statusLabelId && !dryRun) {
      await gmail.users.messages.modify({
        userId: "me",
        id: latestMessage.id!,
        requestBody: {
          addLabelIds: [statusLabelId],
          removeLabelIds: ["INBOX", "UNREAD"],
        },
      });
    }

    return { processed: true };
  } catch (error) {
    // Log error but don't throw - we've already marked it as received
    console.error(`Failed to process cancellation email ${latestMessage.id}:`, error);
    return { processed: false };
  }
}
