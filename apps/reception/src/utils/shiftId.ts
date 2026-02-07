import { getItalyTimestampCompact } from "./dateUtils";

export const SHIFT_ID_STORAGE_KEY = "reception.currentShiftId";

export function generateShiftId(): string {
  return `shift_${getItalyTimestampCompact(new Date())}`;
}

export function getStoredShiftId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SHIFT_ID_STORAGE_KEY);
}

export function setStoredShiftId(shiftId: string | null): void {
  if (typeof window === "undefined") return;
  if (shiftId) {
    window.localStorage.setItem(SHIFT_ID_STORAGE_KEY, shiftId);
  } else {
    window.localStorage.removeItem(SHIFT_ID_STORAGE_KEY);
  }
}
