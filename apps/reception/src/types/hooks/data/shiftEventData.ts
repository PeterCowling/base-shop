// src/types/hooks/data/shiftEventData.ts

export interface ShiftEventData {
  user: string;
  timestamp: string;
  action: "open" | "close" | "reconcile";
  cashCount: number;
  keycardCount: number;
  difference?: number;
  shiftId?: string;
}

export type ShiftEvents = Record<string, ShiftEventData> | null;
