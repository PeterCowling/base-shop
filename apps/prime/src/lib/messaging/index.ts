/**
 * Messaging module exports.
 */

export {
  MessagingEventType,
  bookingConfirmedPayloadSchema,
  arrival7DaysPayloadSchema,
  arrival48HoursPayloadSchema,
  arrivalMorningPayloadSchema,
  messagingPayloadSchema,
  messagingQueueRecordSchema,
  generateEventId,
  createQueueRecord,
} from './triggers';

export type {
  BookingConfirmedPayload,
  Arrival7DaysPayload,
  Arrival48HoursPayload,
  ArrivalMorningPayload,
  MessagingPayload,
  MessagingQueueRecord,
} from './triggers';
