export type PrimeRequestType =
  | "extension"
  | "bag_drop"
  | "meal_change_exception";

export type PrimeRequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "completed";

export interface PrimeRequestResolution {
  operatorId: string;
  operatorName: string;
  resolvedAt: number;
  note?: string;
}

export interface PrimeRequestRecord {
  requestId: string;
  type: PrimeRequestType;
  status: PrimeRequestStatus;
  bookingId: string;
  guestUuid: string;
  guestName: string;
  submittedAt: number;
  updatedAt: number;
  note?: string;
  payload?: Record<string, unknown>;
  resolution?: PrimeRequestResolution;
}

export type PrimeRequestsById = Record<string, PrimeRequestRecord>;
