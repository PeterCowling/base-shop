import { extractSection, normalizeNewlines, parseTaskIdList } from "./markdown.js";

export interface ParsedWave {
  wave: number;
  tasks: string[];
  prerequisites: string[];
  notes: string;
}

export interface ParallelismGuideParseResult {
  waves: ParsedWave[];
  duplicateTaskIds: string[];
}

export function parseParallelismGuide(planMarkdown: string): ParallelismGuideParseResult | null {
  const section = extractSection(planMarkdown, "Parallelism Guide");
  if (!section) {
    return null;
  }

  const lines = normalizeNewlines(section)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows = lines.filter((line) => line.startsWith("|"));
  if (rows.length < 3) {
    return null;
  }

  const contentRows = rows.slice(2);
  const waves: ParsedWave[] = [];
  const seenTasks = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of contentRows) {
    const cells = row
      .split("|")
      .map((cell) => cell.trim())
      .filter((_, index, arr) => index > 0 && index < arr.length - 1);
    if (cells.length < 4) {
      continue;
    }

    const wave = Number.parseInt(cells[0], 10);
    if (Number.isNaN(wave)) {
      continue;
    }

    const tasks = parseTaskIdList(cells[1]);
    for (const taskId of tasks) {
      if (seenTasks.has(taskId)) {
        duplicates.add(taskId);
      } else {
        seenTasks.add(taskId);
      }
    }

    const prerequisites = parseTaskIdList(
      cells[2].replace(/^wave\s+\d+:\s*/i, ""),
    );

    waves.push({
      wave,
      tasks,
      prerequisites,
      notes: cells[3],
    });
  }

  return {
    waves: waves.sort((a, b) => a.wave - b.wave),
    duplicateTaskIds: [...duplicates].sort(),
  };
}
