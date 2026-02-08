/**
 * kpiAggregator.ts
 *
 * Pure functions for aggregating owner KPIs from raw booking/occupant data.
 * These are designed to be called by a scheduled job or on-demand endpoint.
 *
 * IMPORTANT: This module contains PURE functions only - no Firebase I/O.
 * See kpiWriter.ts for persistence and kpiReader.ts for retrieval.
 */

/**
 * Daily KPI record stored in Firebase at ownerKpis/{date}
 * All percentages are 0-100, all counts are non-negative integers.
 */
export interface DailyKpiRecord {
  date: string; // YYYY-MM-DD
  guestCount: number;
  readinessCompletionPct: number; // Average readiness score across all guests
  etaSubmissionPct: number; // Percentage of guests who submitted ETA
  arrivalCodeGenPct: number; // Percentage of bookings with check-in code
  medianCheckInLagMinutes: number; // Median time between check-in time and actual check-in
  extensionRequestCount: number;
  bagDropRequestCount: number;
  updatedAt: number; // timestamp
}

/**
 * Zero-safe defaults for empty days or missing data.
 * Use this instead of null/undefined to avoid crashes in dashboard rendering.
 */
export const ZERO_SAFE_DEFAULTS: Omit<DailyKpiRecord, 'date' | 'updatedAt'> = {
  guestCount: 0,
  readinessCompletionPct: 0,
  etaSubmissionPct: 0,
  arrivalCodeGenPct: 0,
  medianCheckInLagMinutes: 0,
  extensionRequestCount: 0,
  bagDropRequestCount: 0,
};

/**
 * Simplified data structures matching Firebase schema.
 * These are intentionally minimal - only fields needed for KPI computation.
 */
interface ChecklistProgress {
  routePlanned: boolean;
  etaConfirmed: boolean;
  cashPrepared: boolean;
  rulesReviewed: boolean;
  locationSaved: boolean;
}

interface PreArrivalData {
  checklistProgress?: ChecklistProgress;
  etaConfirmedAt?: number | null;
}

interface OccupantData {
  preArrival?: PreArrivalData | null;
  extensionRequests?: Record<string, unknown>;
  bagDropRequests?: Record<string, unknown>;
}

interface BookingData {
  checkInDate: string;
  checkInCode?: string | null;
  checkInAt?: number | null;
  occupants?: Record<string, OccupantData>;
}

export interface RawDayData {
  bookings: Record<string, BookingData>;
}

/**
 * Compute readiness score for a single guest from checklist progress.
 * Uses same weights as readinessScore.ts to maintain consistency.
 */
const CHECKLIST_WEIGHTS: Record<keyof ChecklistProgress, number> = {
  routePlanned: 25,
  etaConfirmed: 20,
  cashPrepared: 25,
  rulesReviewed: 15,
  locationSaved: 15,
};

function computeReadinessScore(checklist: ChecklistProgress | undefined): number {
  if (!checklist) return 0;

  return Object.entries(checklist).reduce((score, [key, completed]) => {
    const weight = CHECKLIST_WEIGHTS[key as keyof ChecklistProgress] ?? 0;
    return score + (completed ? weight : 0);
  }, 0);
}

/**
 * Compute median of an array of numbers.
 * Returns 0 for empty arrays.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Safe percentage calculation.
 * Returns 0 when denominator is 0 (avoids NaN).
 */
function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

/**
 * Aggregate daily KPIs from raw booking data for a specific date.
 *
 * This is a PURE function - no I/O, deterministic output for same input.
 *
 * @param date - Date to aggregate (YYYY-MM-DD)
 * @param data - Raw booking data from Firebase
 * @returns Daily KPI record with all metrics
 */
export function aggregateDailyKpis(date: string, data: RawDayData): DailyKpiRecord {
  // Filter bookings by check-in date
  const relevantBookings = Object.entries(data.bookings).filter(
    ([, booking]) => booking.checkInDate === date,
  );

  if (relevantBookings.length === 0) {
    return {
      date,
      ...ZERO_SAFE_DEFAULTS,
      updatedAt: Date.now(),
    };
  }

  // Collect all occupants from relevant bookings
  const allOccupants: OccupantData[] = [];
  let bookingsWithCode = 0;
  const checkInLags: number[] = [];

  for (const [, booking] of relevantBookings) {
    const occupants = booking.occupants ?? {};
    allOccupants.push(...Object.values(occupants));

    // Count bookings with check-in code
    if (booking.checkInCode) {
      bookingsWithCode++;
    }

    // Compute check-in lag if check-in happened
    if (booking.checkInAt) {
      // Check-in time is 15:00 on check-in date (standard hostel check-in time)
      const checkInTimeExpected = new Date(date + 'T15:00:00Z').getTime();
      const lagMinutes = (booking.checkInAt - checkInTimeExpected) / (60 * 1000);
      if (lagMinutes >= 0) {
        // Only count positive lags (early check-ins are not relevant)
        checkInLags.push(lagMinutes);
      }
    }
  }

  const guestCount = allOccupants.length;

  // Compute readiness completion percentage
  const readinessScores = allOccupants.map((occ) =>
    computeReadinessScore(occ.preArrival?.checklistProgress),
  );
  const avgReadiness =
    readinessScores.length > 0
      ? readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length
      : 0;

  // Compute ETA submission percentage
  const occupantsWithEta = allOccupants.filter(
    (occ) => occ.preArrival?.etaConfirmedAt != null && occ.preArrival.etaConfirmedAt > 0,
  ).length;
  const etaSubmissionPct = percentage(occupantsWithEta, guestCount);

  // Compute arrival code generation percentage
  const arrivalCodeGenPct = percentage(bookingsWithCode, relevantBookings.length);

  // Compute median check-in lag
  const medianCheckInLagMinutes = median(checkInLags);

  // Count extension and bag drop requests
  let extensionRequestCount = 0;
  let bagDropRequestCount = 0;

  for (const occ of allOccupants) {
    if (occ.extensionRequests) {
      extensionRequestCount += Object.keys(occ.extensionRequests).length;
    }
    if (occ.bagDropRequests) {
      bagDropRequestCount += Object.keys(occ.bagDropRequests).length;
    }
  }

  return {
    date,
    guestCount,
    readinessCompletionPct: avgReadiness,
    etaSubmissionPct,
    arrivalCodeGenPct,
    medianCheckInLagMinutes,
    extensionRequestCount,
    bagDropRequestCount,
    updatedAt: Date.now(),
  };
}
