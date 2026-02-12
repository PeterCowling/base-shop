/**
 * kpiWriter.ts
 *
 * Firebase write operations for owner KPI aggregates.
 * This module would be called by a scheduled job or on-demand endpoint.
 *
 * IMPORTANT: This is write-only and should be called from server-side
 * (Cloud Function, scheduled task, or privileged API endpoint).
 */

import { getDatabase, ref, set } from 'firebase/database';

import type { DailyKpiRecord } from './kpiAggregator';

/**
 * Write daily KPI aggregate to Firebase.
 *
 * Writes to ownerKpis/{date} path.
 * Should be called from server-side context with appropriate permissions.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param record - Daily KPI record to write
 */
export async function writeDailyKpi(date: string, record: DailyKpiRecord): Promise<void> {
  const db = getDatabase();
  const kpiRef = ref(db, `ownerKpis/${date}`);

  try {
    await set(kpiRef, record);
  } catch (error) {
    console.error(`Failed to write KPI for date ${date}:`, error);
    throw error;
  }
}

/**
 * Write multiple daily KPI aggregates in batch.
 *
 * @param records - Array of daily KPI records to write
 */
export async function writeDailyKpiBatch(records: DailyKpiRecord[]): Promise<void> {
  const promises = records.map((record) => writeDailyKpi(record.date, record));
  await Promise.all(promises);
}
