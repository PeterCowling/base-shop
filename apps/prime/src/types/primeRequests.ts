export type PrimeRequestType = 'extension' | 'bag_drop' | 'meal_change_exception';

export type PrimeRequestStatus = 'pending' | 'approved' | 'declined' | 'completed';

export interface PrimeRequestResolution {
  operatorId: string;
  operatorName: string;
  note?: string;
  resolvedAt: number;
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

export interface PrimeRequestSummaryByGuest {
  extension?: PrimeRequestRecord | null;
  bag_drop?: PrimeRequestRecord | null;
  meal_change_exception?: PrimeRequestRecord | null;
}
