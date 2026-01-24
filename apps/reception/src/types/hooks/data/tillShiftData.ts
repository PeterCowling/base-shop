export type TillShiftStatus = "open" | "closed";

export interface TillShift {
  id?: string;
  shiftId: string;
  status?: TillShiftStatus;
  openedAt: string;
  openedBy: string;
  openingCash?: number;
  openingKeycards?: number;
  closedAt?: string;
  closedBy?: string;
  closingCash?: number;
  closingKeycards?: number;
  closeDifference?: number;
  closeType?: "close" | "reconcile";
  varianceSignoffRequired?: boolean;
  signedOffBy?: string;
  signedOffByUid?: string;
  signedOffAt?: string;
  varianceNote?: string;
}

export type TillShifts = Record<string, TillShift> | null;
