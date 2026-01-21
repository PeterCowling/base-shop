// Types-compat declarations for miscellaneous modules used in platform-machine

declare module "@date-utils" {
  export function parseDate(date: string | Date): Date;
  export function formatDate(date: Date, format?: string): string;
  export function addDays(date: Date, days: number): Date;
  export function subDays(date: Date, days: number): Date;
  export function addHours(date: Date, hours: number): Date;
  export function differenceInDays(dateLeft: Date, dateRight: Date): number;
  export function differenceInHours(dateLeft: Date, dateRight: Date): number;
  export function isAfter(date: Date, dateToCompare: Date): boolean;
  export function isBefore(date: Date, dateToCompare: Date): boolean;
  export function isPast(date: Date): boolean;
  export function isFuture(date: Date): boolean;
  export function startOfDay(date: Date): Date;
  export function endOfDay(date: Date): Date;
  export function now(): Date;
  export function nowIso(): string;
  export function isoDateInNDays(n: number): string;
  export function calculateRentalDays(start: Date, end: Date): number;
  export function formatTimestamp(date: Date | string): string;
  export function parseTargetDate(date: string): Date;
  export function getTimeRemaining(targetDate: Date): { days: number; hours: number; minutes: number; seconds: number };
  export function formatDuration(duration: { days: number; hours: number; minutes: number; seconds: number }): string;
  export const DAY_MS: number;
  export const HOUR_MS: number;
  export const MINUTE_MS: number;
}

declare module "@acme/date-utils" {
  export * from "@date-utils";
}
