import {
  formatTaskIdList,
  isTaskComplete,
  isTaskDeferred,
  normalizeNewlines,
  parseTaskBlocks,
  parseTaskIdList,
} from "./markdown.js";

type NodeKind = {
  id: string;
  title: string;
  type: string;
  effort: "S" | "M" | "L";
  status: string;
  affects: string[];
  dependsOn: string[];
  raw: string;
};

export interface SequencePlanResult {
  markdown: string;
  orderedTaskIds: string[];
  parallelWaves: Array<{ wave: number; tasks: string[]; prerequisites: string[]; notes: string }>;
}

export function sequencePlanMarkdown(planMarkdown: string): SequencePlanResult {
  const tasks = parseTaskBlocks(planMarkdown);
  const nodeMap = new Map<string, NodeKind>();
  for (const task of tasks) {
    nodeMap.set(task.id, {
      id: task.id,
      title: task.title,
      type: (task.fields["type"] ?? "").trim().toUpperCase(),
      effort: parseEffort(task.fields["effort"]),
      status: task.fields["status"] ?? "",
      affects: parseAffects(task.fields["affects"] ?? ""),
      dependsOn: parseTaskIdList(task.fields["depends-on"] ?? "-"),
      raw: task.raw,
    });
  }

  const active = tasks
    .map((task) => nodeMap.get(task.id))
    .filter((task): task is NodeKind => Boolean(task))
    .filter((task) => !isTaskComplete(task.status) && !isTaskDeferred(task.status));

  const activeIds = new Set(active.map((task) => task.id));
  const graph = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();
  for (const task of active) {
    graph.set(task.id, new Set());
    indegree.set(task.id, 0);
  }

  for (const task of active) {
    for (const dep of task.dependsOn) {
      if (!activeIds.has(dep)) {
        continue;
      }
      addEdge(graph, indegree, dep, task.id);
    }
  }

  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      if (!hasOverlap(active[i].affects, active[j].affects)) {
        continue;
      }
      const [before, after] = chooseImplicitOrder(active[i], active[j]);
      addEdge(graph, indegree, before.id, after.id);
    }
  }

  const sorted = topoSort(active, graph, indegree);
  const blocksMap = invertDependencies(active, graph);

  const updatedTaskBodies = new Map<string, string>();
  for (const taskId of sorted) {
    const node = nodeMap.get(taskId);
    if (!node) {
      continue;
    }
    const deps = [...(findInbound(taskId, graph) ?? [])];
    const blocks = [...(blocksMap.get(taskId) ?? [])];
    updatedTaskBodies.set(
      taskId,
      updateTaskDependencyFields(node.raw, deps, blocks),
    );
  }

  const frozenIds = tasks
    .filter((task) => !activeIds.has(task.id))
    .map((task) => task.id);
  const orderedTaskIds = [...sorted, ...frozenIds];

  for (const taskId of frozenIds) {
    const node = nodeMap.get(taskId);
    if (node) {
      updatedTaskBodies.set(taskId, node.raw);
    }
  }

  const waves = buildWaves(sorted, graph);
  const newTaskSummary = renderTaskSummary(orderedTaskIds, nodeMap, graph);
  const newParallelismGuide = renderParallelismGuide(waves);
  const newTasksSection = renderTasksSection(orderedTaskIds, updatedTaskBodies);

  let nextMarkdown = replaceLevel2Section(planMarkdown, "Task Summary", newTaskSummary);
  nextMarkdown = replaceLevel2Section(nextMarkdown, "Parallelism Guide", newParallelismGuide);
  nextMarkdown = replaceLevel2Section(nextMarkdown, "Tasks", newTasksSection);

  return {
    markdown: nextMarkdown,
    orderedTaskIds,
    parallelWaves: waves,
  };
}

function parseEffort(value: string): "S" | "M" | "L" {
  const normalized = value.trim().toUpperCase();
  if (normalized === "M" || normalized === "L") {
    return normalized;
  }
  return "S";
}

function parseAffects(value: string): string[] {
  if (!value || value.trim() === "-" || value.toLowerCase().startsWith("none")) {
    return [];
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .map((entry) => entry.replace(/^\[readonly\]\s*/i, "").replace(/`/g, "").trim())
    .filter((entry) => entry.length > 0);
}

function hasOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) {
    return false;
  }
  const set = new Set(a);
  return b.some((item) => set.has(item));
}

function chooseImplicitOrder(left: NodeKind, right: NodeKind): [NodeKind, NodeKind] {
  const leftScore = implicitPriority(left);
  const rightScore = implicitPriority(right);
  if (leftScore !== rightScore) {
    return leftScore < rightScore ? [left, right] : [right, left];
  }
  return left.id.localeCompare(right.id) <= 0 ? [left, right] : [right, left];
}

function implicitPriority(task: NodeKind): number {
  const text = `${task.title} ${task.raw}`.toLowerCase();
  const infrastructureHit = /(schema|type|shared|token|foundation|contract|base)/.test(text)
    ? 0
    : 1;
  const effortScore = task.effort === "S" ? 0 : task.effort === "M" ? 1 : 2;
  return infrastructureHit * 10 + effortScore;
}

function topoSort(
  active: NodeKind[],
  graph: Map<string, Set<string>>,
  indegree: Map<string, number>,
): string[] {
  const queue = active
    .map((task) => task.id)
    .filter((id) => (indegree.get(id) ?? 0) === 0);

  const byId = new Map(active.map((task) => [task.id, task]));
  const result: string[] = [];

  const sortQueue = (): void => {
    queue.sort((a, b) => compareForSequence(byId.get(a), byId.get(b)));
  };

  sortQueue();
  while (queue.length > 0) {
    const nextId = queue.shift();
    if (!nextId) {
      break;
    }
    result.push(nextId);
    const neighbors = [...(graph.get(nextId) ?? [])];
    for (const neighbor of neighbors) {
      const current = (indegree.get(neighbor) ?? 0) - 1;
      indegree.set(neighbor, current);
      if (current === 0) {
        queue.push(neighbor);
      }
    }
    sortQueue();
  }

  if (result.length !== active.length) {
    const unresolved = active
      .map((task) => task.id)
      .filter((id) => !result.includes(id));
    throw new Error(
      `Dependency cycle detected while sequencing tasks: ${unresolved.join(", ")}`,
    );
  }
  return result;
}

function compareForSequence(left: NodeKind | undefined, right: NodeKind | undefined): number {
  if (!left || !right) {
    return 0;
  }
  const typeRank = (type: string): number => {
    if (type === "INVESTIGATE" || type === "DECISION" || type === "SPIKE") return 0;
    if (type === "IMPLEMENT") return 1;
    if (type === "CHECKPOINT") return 3;
    return 2;
  };
  const leftType = typeRank(left.type);
  const rightType = typeRank(right.type);
  if (leftType !== rightType) {
    return leftType - rightType;
  }

  const effortRank = (effort: "S" | "M" | "L"): number =>
    effort === "S" ? 0 : effort === "M" ? 1 : 2;
  const leftEffort = effortRank(left.effort);
  const rightEffort = effortRank(right.effort);
  if (leftEffort !== rightEffort) {
    return leftEffort - rightEffort;
  }

  if (left.title && right.title && left.title !== right.title) {
    return left.title.localeCompare(right.title);
  }
  return left.id.localeCompare(right.id);
}

function addEdge(
  graph: Map<string, Set<string>>,
  indegree: Map<string, number>,
  from: string,
  to: string,
): void {
  if (from === to) {
    return;
  }
  const neighbors = graph.get(from);
  if (!neighbors || neighbors.has(to)) {
    return;
  }
  neighbors.add(to);
  indegree.set(to, (indegree.get(to) ?? 0) + 1);
}

function invertDependencies(
  active: NodeKind[],
  graph: Map<string, Set<string>>,
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const task of active) {
    out.set(task.id, new Set());
  }
  for (const [from, tos] of graph.entries()) {
    for (const to of tos) {
      const bucket = out.get(from);
      if (!bucket) {
        continue;
      }
      bucket.add(to);
    }
  }
  return out;
}

function findInbound(
  target: string,
  graph: Map<string, Set<string>>,
): Set<string> | null {
  const inbound = new Set<string>();
  for (const [from, tos] of graph.entries()) {
    if (tos.has(target)) {
      inbound.add(from);
    }
  }
  return inbound;
}

function updateTaskDependencyFields(
  rawTask: string,
  dependsOn: string[],
  blocks: string[],
): string {
  let output = rawTask;
  output = replaceTaskField(output, "Depends on", formatTaskIdList(dependsOn));
  output = replaceTaskField(output, "Blocks", formatTaskIdList(blocks));
  return output;
}

function replaceTaskField(taskRaw: string, field: string, value: string): string {
  const normalizedLines = normalizeNewlines(taskRaw).split("\n");
  const patterns = [
    new RegExp(`^(- \\*\\*${escapeRegExp(field)}\\*\\*:\\s*).*$`),
    new RegExp(`^(- ${escapeRegExp(field)}:\\s*).*$`),
  ];
  let replaced = false;
  const lines = normalizedLines.map((line) => {
    for (const pattern of patterns) {
      if (pattern.test(line)) {
        replaced = true;
        return line.replace(pattern, `$1${value}`);
      }
    }
    return line;
  });

  if (replaced) {
    return lines.join("\n");
  }

  const insertAt = lines.findIndex((line) =>
    /^- \*\*Confidence\*\*:/.test(line.trim()),
  );
  const fieldLine = `- **${field}:** ${value}`;
  if (insertAt >= 0) {
    lines.splice(insertAt, 0, fieldLine);
  } else {
    lines.push(fieldLine);
  }
  return lines.join("\n");
}

function buildWaves(
  sortedTaskIds: string[],
  graph: Map<string, Set<string>>,
): Array<{ wave: number; tasks: string[]; prerequisites: string[]; notes: string }> {
  const waveByTask = new Map<string, number>();
  for (const taskId of sortedTaskIds) {
    const inbound = [...(findInbound(taskId, graph) ?? [])];
    const wave =
      inbound.length === 0
        ? 1
        : Math.max(...inbound.map((dep) => waveByTask.get(dep) ?? 1)) + 1;
    waveByTask.set(taskId, wave);
  }

  const grouped = new Map<number, string[]>();
  for (const [taskId, wave] of waveByTask.entries()) {
    const group = grouped.get(wave) ?? [];
    group.push(taskId);
    grouped.set(wave, group);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([wave, tasks]) => {
      const prerequisites = new Set<string>();
      for (const taskId of tasks) {
        for (const dep of findInbound(taskId, graph) ?? []) {
          prerequisites.add(dep);
        }
      }
      return {
        wave,
        tasks: tasks.sort((a, b) => a.localeCompare(b)),
        prerequisites: [...prerequisites].sort((a, b) => a.localeCompare(b)),
        notes: tasks.length > 1 ? "Parallel-safe wave." : "Sequential boundary.",
      };
    });
}

function renderTaskSummary(
  orderedTaskIds: string[],
  nodeMap: Map<string, NodeKind>,
  graph: Map<string, Set<string>>,
): string {
  const lines = [
    "## Task Summary",
    "| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |",
    "|---|---|---|---:|---:|---|---|---|",
  ];

  for (const taskId of orderedTaskIds) {
    const node = nodeMap.get(taskId);
    if (!node) {
      continue;
    }
    const confidenceMatch = node.raw.match(/- \*\*Confidence:\*\*\s*(\d+%?)/i);
    const confidence = confidenceMatch ? confidenceMatch[1] : "n/a";
    const blocks = [...(graph.get(taskId) ?? [])].sort((a, b) => a.localeCompare(b));
    lines.push(
      `| ${taskId} | ${node.type || "n/a"} | ${escapeTable(node.title || "Task")} | ${confidence} | ${node.effort} | ${escapeTable(node.status || "Pending")} | ${formatTaskIdList(node.dependsOn)} | ${formatTaskIdList(blocks)} |`,
    );
  }
  return lines.join("\n");
}

function renderParallelismGuide(
  waves: Array<{ wave: number; tasks: string[]; prerequisites: string[]; notes: string }>,
): string {
  const lines = [
    "## Parallelism Guide",
    "",
    "Execution waves for subagent dispatch. Tasks within a wave can run in parallel.",
    "",
    "| Wave | Tasks | Prerequisites | Notes |",
    "|---|---|---|---|",
  ];
  for (const wave of waves) {
    lines.push(
      `| ${wave.wave} | ${wave.tasks.join(", ")} | ${wave.prerequisites.length > 0 ? wave.prerequisites.join(", ") : "-"} | ${wave.notes} |`,
    );
  }
  return lines.join("\n");
}

function renderTasksSection(
  orderedTaskIds: string[],
  updatedTaskBodies: Map<string, string>,
): string {
  const bodies = orderedTaskIds
    .map((taskId) => updatedTaskBodies.get(taskId))
    .filter((value): value is string => Boolean(value));
  return `## Tasks\n\n${bodies.join("\n\n---\n\n")}`;
}

function replaceLevel2Section(
  markdown: string,
  heading: string,
  replacement: string,
): string {
  const normalized = normalizeNewlines(markdown);
  const lines = normalized.split("\n");
  const headingNeedle = `## ${heading}`.toLowerCase();
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().toLowerCase() === headingNeedle) {
      start = i;
      break;
    }
  }
  if (start < 0) {
    return `${normalized.trimEnd()}\n\n${replacement}\n`;
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const before = lines.slice(0, start).join("\n").trimEnd();
  const after = lines.slice(end).join("\n").trimStart();
  const chunks = [before, replacement, after].filter((chunk) => chunk.length > 0);
  return `${chunks.join("\n\n")}\n`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}
