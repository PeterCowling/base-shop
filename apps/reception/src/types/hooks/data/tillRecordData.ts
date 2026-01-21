// src/types/hooks/data/tillRecordData.ts

/**
 * TillRecordData
 *
 * Represents the structure for a single till record entry stored in Firebase.
 * Each record currently stores a few optional fields like amount,
 * date and an optional note.
 */
export interface TillRecordData {
  /**
   * Properties associated with a till record. Example:
   * {
   *   amount: 42,
   *   date: "2024-05-01T12:00:00Z",
   *   note: "Cash intake for shift"
   * }
   */
  amount?: number;
  date?: string;
  note?: string;
}

/**
 * TillRecords
 *
 * A collection of till records keyed by record ID. When no till records
 * exist the value will be `null`. This typing mirrors other data hooks in
 * the codebase where collections are represented as `Record<string, T> | null`.
 */
export type TillRecords = Record<string, TillRecordData> | null;
