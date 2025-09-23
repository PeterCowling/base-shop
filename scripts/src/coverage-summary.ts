#!/usr/bin/env tsx
import { promises as fs } from 'fs';
import path from 'path';

type Totals = {
  linesFound: number;
  linesHit: number;
  branchesFound: number;
  branchesHit: number;
  funcsFound: number;
  funcsHit: number;
};

function emptyTotals(): Totals {
  return {
    linesFound: 0,
    linesHit: 0,
    branchesFound: 0,
    branchesHit: 0,
    funcsFound: 0,
    funcsHit: 0,
  };
}

async function readIfExists(p: string): Promise<string | null> {
  try {
    const data = await fs.readFile(p, 'utf8');
    if (!data.trim()) return null;
    return data;
  } catch {
    return null;
  }
}

function parseLcov(lcov: string): Totals {
  const totals = emptyTotals();
  // lcov is a sequence of records separated by 'end_of_record'
  // We sum LF/LH/BRF/BRH/FNF/FNH across all records.
  const lines = lcov.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('LF:')) {
      totals.linesFound += Number(line.slice(3));
    } else if (line.startsWith('LH:')) {
      totals.linesHit += Number(line.slice(3));
    } else if (line.startsWith('BRF:')) {
      totals.branchesFound += Number(line.slice(4));
    } else if (line.startsWith('BRH:')) {
      totals.branchesHit += Number(line.slice(4));
    } else if (line.startsWith('FNF:')) {
      totals.funcsFound += Number(line.slice(4));
    } else if (line.startsWith('FNH:')) {
      totals.funcsHit += Number(line.slice(4));
    }
  }
  return totals;
}

function pct(hit: number, found: number): number {
  return found === 0 ? 100 : (hit / found) * 100;
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

async function main() {
  const repoRoot = process.cwd();
  const coverageRoot = path.join(repoRoot, 'coverage');
  const entries = await fs.readdir(coverageRoot, { withFileTypes: true });

  type Row = {
    name: string;
    totals: Totals;
  };
  const rows: Row[] = [];

  // Include per-package/app coverage from coverage/<name>/lcov.info
  for (const de of entries) {
    if (!de.isDirectory()) continue;
    const name = de.name;
    const lcovPath = path.join(coverageRoot, name, 'lcov.info');
    const content = await readIfExists(lcovPath);
    if (!content) continue;
    const totals = parseLcov(content);
    rows.push({ name, totals });
  }

  // Also include root summary if present as a special row
  const rootLcov = await readIfExists(path.join(coverageRoot, 'lcov.info'));
  if (rootLcov) {
    rows.push({ name: '(root)', totals: parseLcov(rootLcov) });
  }

  if (rows.length === 0) {
    console.error('No coverage lcov.info files found under coverage/.');
    process.exit(1);
  }

  // Sort by lines coverage ascending to see weakest first
  rows.sort((a, b) => pct(a.totals.linesHit, a.totals.linesFound) - pct(b.totals.linesHit, b.totals.linesFound));

  // Print concise table
  const header = [
    'Package',
    'Lines',
    'Funcs',
    'Branches',
    'LH/LF',
  ];
  const widths = [
    28, // name
    9,  // lines
    9,  // funcs
    9,  // branches
    15, // LH/LF
  ];

  function pad(s: string, w: number): string {
    if (s.length >= w) return s.slice(0, w);
    return s + ' '.repeat(w - s.length);
  }

  const line = (cols: string[]) => cols.map((c, i) => pad(c, widths[i])).join(' ');

  console.log(line(header));
  console.log(line(widths.map(w => '-'.repeat(Math.min(w, 12)))));

  for (const { name, totals } of rows) {
    const linesPct = formatPct(pct(totals.linesHit, totals.linesFound));
    const funcsPct = formatPct(pct(totals.funcsHit, totals.funcsFound));
    const branchPct = formatPct(pct(totals.branchesHit, totals.branchesFound));
    const lh = `${totals.linesHit}/${totals.linesFound}`;
    console.log(line([name, linesPct, funcsPct, branchPct, lh]));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

