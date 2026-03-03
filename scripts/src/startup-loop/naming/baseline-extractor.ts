import * as fs from 'node:fs';
import * as path from 'node:path';

import { readSidecarEvents } from './event-log-writer';

export interface NamingFunnelMetrics {
  business: string;
  rounds: number[];
  run_dates: string[];
  n_generated: number;
  n_i_gate_eliminated: number;
  n_post_i_gate: number;
  n_rdap_available: number;
  n_rdap_taken: number;
  n_rdap_unknown: number;
  rdap_yield_pct: number;       // n_rdap_available / n_post_i_gate * 100
  n_shortlisted: number;
  n_finalists: number;
  avg_score_available: number | null;  // mean total score for available candidates
  avg_score_taken: number | null;
  source_files: string[];
  computed_at: string;           // ISO timestamp
}

/**
 * Reads sidecar JSONL files from one or more rounds and produces aggregate funnel metrics.
 *
 * @param sidecarDir - directory containing *.jsonl sidecar files
 * @param options.rounds - optional filter to only include specific round numbers
 * @param options.baseDir - unused (reserved for future relative path resolution)
 */
export function extractBaselineMetrics(
  sidecarDir: string,
  options?: { rounds?: number[]; baseDir?: string }
): NamingFunnelMetrics {
  // Scan for all *.jsonl files in the sidecar directory
  let jsonlFiles: string[] = [];

  if (fs.existsSync(sidecarDir)) {
    const entries = fs.readdirSync(sidecarDir);
    jsonlFiles = entries
      .filter((entry) => entry.endsWith('.jsonl'))
      .map((entry) => path.join(sidecarDir, entry))
      .sort();
  }

  // Read all events from all files
  let allEvents = jsonlFiles.flatMap((file) => readSidecarEvents(file));

  // Filter by rounds if specified
  if (options?.rounds && options.rounds.length > 0) {
    const roundSet = new Set(options.rounds);
    allEvents = allEvents.filter((e) => roundSet.has(e.round));
  }

  // Aggregate counters
  let n_generated = 0;
  let n_i_gate_eliminated = 0;
  let n_rdap_available = 0;
  let n_rdap_taken = 0;
  let n_rdap_unknown = 0;
  let n_shortlisted = 0;
  let n_finalists = 0;

  const roundsSet = new Set<number>();
  const runDatesSet = new Set<string>();
  const businessSet = new Set<string>();

  // Score accumulators for available vs taken
  const availableScores: number[] = [];
  const takenScores: number[] = [];

  for (const event of allEvents) {
    roundsSet.add(event.round);
    runDatesSet.add(event.run_date);
    businessSet.add(event.business);

    switch (event.stage) {
      case 'generated':
        n_generated++;
        break;
      case 'i_gate_eliminated':
        n_i_gate_eliminated++;
        break;
      case 'rdap_checked':
        if (event.rdap?.status === 'available') {
          n_rdap_available++;
          if (event.candidate.scores?.total !== undefined && event.candidate.scores.total !== null) {
            availableScores.push(event.candidate.scores.total);
          }
        } else if (event.rdap?.status === 'taken') {
          n_rdap_taken++;
          if (event.candidate.scores?.total !== undefined && event.candidate.scores.total !== null) {
            takenScores.push(event.candidate.scores.total);
          }
        } else {
          n_rdap_unknown++;
        }
        break;
      case 'shortlisted':
        n_shortlisted++;
        break;
      case 'finalist':
        n_finalists++;
        break;
    }
  }

  const n_post_i_gate = n_generated - n_i_gate_eliminated;
  const rdap_yield_pct = n_post_i_gate > 0
    ? (n_rdap_available / n_post_i_gate) * 100
    : 0;

  const avg_score_available = availableScores.length > 0
    ? availableScores.reduce((sum, s) => sum + s, 0) / availableScores.length
    : null;

  const avg_score_taken = takenScores.length > 0
    ? takenScores.reduce((sum, s) => sum + s, 0) / takenScores.length
    : null;

  // Derive business from events or default to empty string
  const business = businessSet.size === 1 ? [...businessSet][0] : [...businessSet].join(',');

  return {
    business,
    rounds: [...roundsSet].sort((a, b) => a - b),
    run_dates: [...runDatesSet].sort(),
    n_generated,
    n_i_gate_eliminated,
    n_post_i_gate,
    n_rdap_available,
    n_rdap_taken,
    n_rdap_unknown,
    rdap_yield_pct,
    n_shortlisted,
    n_finalists,
    avg_score_available,
    avg_score_taken,
    source_files: jsonlFiles,
    computed_at: new Date().toISOString(),
  };
}
