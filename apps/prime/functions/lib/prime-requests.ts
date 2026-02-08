import type { PrimeRequestRecord, PrimeRequestStatus, PrimeRequestType } from '../../src/types/primeRequests';

export function buildPrimeRequestId(type: PrimeRequestType): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `${type}_${Date.now()}_${suffix}`;
}

export function createPrimeRequestRecord(input: {
  requestId: string;
  type: PrimeRequestType;
  bookingId: string;
  guestUuid: string;
  guestName: string;
  note?: string;
  payload?: Record<string, unknown>;
}): PrimeRequestRecord {
  const now = Date.now();
  return {
    requestId: input.requestId,
    type: input.type,
    status: 'pending',
    bookingId: input.bookingId,
    guestUuid: input.guestUuid,
    guestName: input.guestName,
    submittedAt: now,
    updatedAt: now,
    note: input.note,
    payload: input.payload,
  };
}

export function createPrimeRequestWritePayload(
  request: PrimeRequestRecord,
): Record<string, unknown> {
  return {
    [`primeRequests/byId/${request.requestId}`]: request,
    [`primeRequests/byGuest/${request.guestUuid}/${request.requestId}`]: true,
    [`primeRequests/byStatus/${request.status}/${request.requestId}`]: true,
    [`primeRequests/byType/${request.type}/${request.requestId}`]: true,
  };
}

export function createPrimeRequestStatusUpdatePayload(input: {
  requestId: string;
  previousStatus: PrimeRequestStatus;
  nextStatus: PrimeRequestStatus;
  patch: Partial<PrimeRequestRecord>;
}): Record<string, unknown> {
  return {
    [`primeRequests/byId/${input.requestId}`]: input.patch,
    [`primeRequests/byStatus/${input.previousStatus}/${input.requestId}`]: null,
    [`primeRequests/byStatus/${input.nextStatus}/${input.requestId}`]: true,
  };
}
