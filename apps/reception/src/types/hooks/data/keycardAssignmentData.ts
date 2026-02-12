export type KeycardAssignmentStatus =
  | "issued"
  | "returned"
  | "lost"
  | "replaced";

export interface KeycardAssignment {
  keycardNumber: string;
  isMasterKey: boolean;
  // Guest key fields
  occupantId?: string;
  bookingRef?: string;
  roomNumber?: string;
  depositMethod?: string;
  depositAmount?: number;
  // Master key fields
  assignedToStaff?: string;
  // Common fields
  assignedAt: string;
  assignedBy: string;
  returnedAt?: string;
  returnedBy?: string;
  status: KeycardAssignmentStatus;
  replacedByAssignmentId?: string;
  replacesAssignmentId?: string;
  loanTxnId?: string;
  shiftId?: string;
}

export type KeycardAssignments = Record<string, KeycardAssignment> | null;
