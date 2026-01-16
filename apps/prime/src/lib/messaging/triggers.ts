/**
 * Pre-arrival messaging event triggers.
 *
 * Defines event types and payload schemas for automated messaging.
 * Events are written to Firebase `messagingQueue/{eventId}` for processing
 * by Cloud Functions.
 */

import { z } from 'zod';

/**
 * Messaging event types for pre-arrival flow.
 */
export const MessagingEventType = {
  /** Immediate welcome email after booking confirmation */
  BOOKING_CONFIRMED: 'booking.confirmed',
  /** Week-before reminder with readiness checklist */
  ARRIVAL_7_DAYS: 'arrival.7days',
  /** 48-hour reminder for cash + ETA confirmation */
  ARRIVAL_48_HOURS: 'arrival.48hours',
  /** Day-of check-in with QR code */
  ARRIVAL_MORNING: 'arrival.morning',
} as const;

export type MessagingEventType =
  (typeof MessagingEventType)[keyof typeof MessagingEventType];

/**
 * Base payload schema for all messaging events.
 */
const basePayloadSchema = z.object({
  /** Occupant UUID */
  uuid: z.string().min(1),
  /** Booking/reservation code */
  bookingCode: z.string().min(1),
  /** Guest's email address */
  email: z.string().email(),
  /** Guest's first name for personalization */
  firstName: z.string().min(1),
  /** Guest's preferred language code (e.g., 'en', 'it') */
  language: z.string().default('en'),
});

/**
 * Payload for booking.confirmed event.
 */
export const bookingConfirmedPayloadSchema = basePayloadSchema.extend({
  eventType: z.literal(MessagingEventType.BOOKING_CONFIRMED),
  /** Check-in date (ISO format YYYY-MM-DD) */
  checkInDate: z.string(),
  /** Check-out date (ISO format YYYY-MM-DD) */
  checkOutDate: z.string(),
  /** Number of nights */
  nights: z.number().positive(),
  /** Personal portal URL */
  portalUrl: z.string().url(),
});

export type BookingConfirmedPayload = z.infer<typeof bookingConfirmedPayloadSchema>;

/**
 * Payload for arrival.7days event.
 */
export const arrival7DaysPayloadSchema = basePayloadSchema.extend({
  eventType: z.literal(MessagingEventType.ARRIVAL_7_DAYS),
  /** Check-in date (ISO format YYYY-MM-DD) */
  checkInDate: z.string(),
  /** Days until check-in */
  daysUntil: z.number().nonnegative(),
  /** Current readiness score (0-100) */
  readinessScore: z.number().min(0).max(100),
  /** Personal portal URL */
  portalUrl: z.string().url(),
});

export type Arrival7DaysPayload = z.infer<typeof arrival7DaysPayloadSchema>;

/**
 * Payload for arrival.48hours event.
 */
export const arrival48HoursPayloadSchema = basePayloadSchema.extend({
  eventType: z.literal(MessagingEventType.ARRIVAL_48_HOURS),
  /** Check-in date (ISO format YYYY-MM-DD) */
  checkInDate: z.string(),
  /** City tax amount due */
  cityTaxDue: z.number().nonnegative(),
  /** Deposit amount due */
  depositDue: z.number().nonnegative(),
  /** Whether ETA has been confirmed */
  etaConfirmed: z.boolean(),
  /** Whether cash is marked as prepared */
  cashPrepared: z.boolean(),
  /** Personal portal URL */
  portalUrl: z.string().url(),
});

export type Arrival48HoursPayload = z.infer<typeof arrival48HoursPayloadSchema>;

/**
 * Payload for arrival.morning event.
 */
export const arrivalMorningPayloadSchema = basePayloadSchema.extend({
  eventType: z.literal(MessagingEventType.ARRIVAL_MORNING),
  /** Check-in code for QR generation */
  checkInCode: z.string().min(1),
  /** Check-in time window (e.g., "15:00-22:00") */
  checkInWindow: z.string(),
  /** Expected arrival time if confirmed (HH:MM format) */
  etaWindow: z.string().nullable(),
  /** Total cash to bring */
  totalCashDue: z.number().nonnegative(),
  /** Personal portal URL (for QR code generation) */
  portalUrl: z.string().url(),
});

export type ArrivalMorningPayload = z.infer<typeof arrivalMorningPayloadSchema>;

/**
 * Union of all messaging payloads.
 */
export const messagingPayloadSchema = z.discriminatedUnion('eventType', [
  bookingConfirmedPayloadSchema,
  arrival7DaysPayloadSchema,
  arrival48HoursPayloadSchema,
  arrivalMorningPayloadSchema,
]);

export type MessagingPayload = z.infer<typeof messagingPayloadSchema>;

/**
 * Messaging queue record schema.
 * This is what gets written to Firebase.
 */
export const messagingQueueRecordSchema = z.object({
  /** Unique event ID */
  eventId: z.string().min(1),
  /** Event type */
  eventType: z.nativeEnum(MessagingEventType),
  /** Event payload */
  payload: messagingPayloadSchema,
  /** When the event was created */
  createdAt: z.number(),
  /** Processing status */
  status: z.enum(['pending', 'processing', 'sent', 'failed']).default('pending'),
  /** Number of retry attempts */
  retryCount: z.number().default(0),
  /** Last error message if failed */
  lastError: z.string().nullable().default(null),
  /** When the event was processed */
  processedAt: z.number().nullable().default(null),
});

export type MessagingQueueRecord = z.infer<typeof messagingQueueRecordSchema>;

/**
 * Generate a unique event ID.
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `msg_${timestamp}_${random}`;
}

/**
 * Create a messaging queue record for Firebase.
 */
export function createQueueRecord(
  eventType: MessagingEventType,
  payload: MessagingPayload,
): MessagingQueueRecord {
  return {
    eventId: generateEventId(),
    eventType,
    payload,
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0,
    lastError: null,
    processedAt: null,
  };
}
