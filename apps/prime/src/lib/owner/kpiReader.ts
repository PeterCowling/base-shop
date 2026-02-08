/**
 * kpiReader.ts
 *
 * Firebase read operations for owner KPI aggregates.
 * All reads are from pre-aggregated ownerKpis/{date} nodes ONLY.
 *
 * CRITICAL: This module NEVER falls back to raw booking scans.
 * Missing days return zero-safe defaults to maintain cost safety.
 */

import { get,getDatabase, ref } from 'firebase/database';

import { type DailyKpiRecord,ZERO_SAFE_DEFAULTS } from './kpiAggregator';

/**
 * Read daily KPI aggregate for a specific date.
 *
 * Reads from ownerKpis/{date} aggregate path only.
 * NEVER performs raw booking scans as fallback.
 *
 * @param date - Date in YYYY-MM-DD format
 * @returns Daily KPI record, or zero-safe defaults if missing
 */
export async function readDailyKpi(date: string): Promise<DailyKpiRecord> {
  const db = getDatabase();
  const kpiRef = ref(db, `ownerKpis/${date}`);

  try {
    const snapshot = await get(kpiRef);

    if (!snapshot.exists()) {
      // Return zero-safe defaults for missing days
      // IMPORTANT: Do NOT fall back to raw booking scans
      return {
        date,
        ...ZERO_SAFE_DEFAULTS,
        updatedAt: Date.now(),
      };
    }

    const data = snapshot.val() as DailyKpiRecord;

    // Validate and sanitize data
    return {
      date: data.date ?? date,
      guestCount: data.guestCount ?? 0,
      readinessCompletionPct: data.readinessCompletionPct ?? 0,
      etaSubmissionPct: data.etaSubmissionPct ?? 0,
      arrivalCodeGenPct: data.arrivalCodeGenPct ?? 0,
      medianCheckInLagMinutes: data.medianCheckInLagMinutes ?? 0,
      extensionRequestCount: data.extensionRequestCount ?? 0,
      bagDropRequestCount: data.bagDropRequestCount ?? 0,
      updatedAt: data.updatedAt ?? Date.now(),
    };
  } catch (error) {
    // Log error but return zero-safe defaults to avoid crashing dashboards
    console.error(`Failed to read KPI for date ${date}:`, error);
    return {
      date,
      ...ZERO_SAFE_DEFAULTS,
      updatedAt: Date.now(),
    };
  }
}

/**
 * Generate array of dates between start and end (inclusive).
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of date strings in YYYY-MM-DD format
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Read KPI aggregates for a date range.
 *
 * Performs one read per day from ownerKpis/{date} path.
 * Cost budget: N reads for N days (not N * bookings).
 *
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @returns Array of daily KPI records
 */
export async function readKpiRange(
  startDate: string,
  endDate: string,
): Promise<DailyKpiRecord[]> {
  const dates = generateDateRange(startDate, endDate);

  // Read all days in parallel for better performance
  const promises = dates.map((date) => readDailyKpi(date));
  const results = await Promise.all(promises);

  return results;
}
