import { execFileSync } from "node:child_process";

type WorkflowConclusion = string | null;

export type WorkflowRunRecord = {
  databaseId: number;
  workflowName?: string | null;
  headBranch?: string | null;
  event?: string | null;
  status: string;
  conclusion: WorkflowConclusion;
  createdAt: string;
  updatedAt: string;
  headSha?: string | null;
  url?: string | null;
};

export type WorkflowJobRecord = {
  name: string;
  conclusion: WorkflowConclusion;
  startedAt: string | null;
  completedAt: string | null;
  runId?: number;
};

export type WorkflowRunFilters = {
  branch?: string;
  event?: string;
  from?: string;
  to?: string;
};

export type DurationStats = {
  count: number;
  p50: number | null;
  p90: number | null;
  avg: number | null;
};

export type WorkflowRunSummary = {
  total: number;
  outcomes: Record<string, number>;
  durations: {
    completed: DurationStats;
    success: DurationStats;
  };
  sampleWindow: {
    requestedFrom: string | null;
    requestedTo: string | null;
    observedFrom: string | null;
    observedTo: string | null;
  };
  filters: {
    branch?: string;
    event?: string;
  };
};

type CliOptions = {
  workflows: string[];
  limit: number;
  branch?: string;
  event?: string;
  from?: string;
  to?: string;
  includeJobs: boolean;
  repository?: string;
};

type CollectedWorkflowMetrics = {
  workflow: string;
  runCount: number;
  summary: WorkflowRunSummary;
  jobDurations: ReturnType<typeof summarizeJobDurations>;
};

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function calculateDurationMinutes(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
): number | null {
  const start = parseTimestamp(startedAt);
  const end = parseTimestamp(endedAt);
  if (start === null || end === null || end < start) return null;
  return (end - start) / 60000;
}

function percentile(values: number[], point: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * point;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function summarizeDurations(values: number[]): DurationStats {
  if (values.length === 0) {
    return {
      count: 0,
      p50: null,
      p90: null,
      avg: null,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    count: values.length,
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
    avg: total / values.length,
  };
}

function normalizeOutcome(conclusion: WorkflowConclusion): string {
  if (conclusion === null) return "null";
  const normalized = conclusion.trim();
  return normalized.length > 0 ? normalized : "null";
}

export function filterWorkflowRuns(
  runs: WorkflowRunRecord[],
  filters: WorkflowRunFilters = {},
): WorkflowRunRecord[] {
  return runs.filter((run) => {
    if (filters.branch && run.headBranch !== filters.branch) return false;
    if (filters.event && run.event !== filters.event) return false;

    const createdAt = parseTimestamp(run.createdAt);
    if (filters.from) {
      const from = parseTimestamp(filters.from);
      if (from !== null && (createdAt === null || createdAt < from)) return false;
    }
    if (filters.to) {
      const to = parseTimestamp(filters.to);
      if (to !== null && (createdAt === null || createdAt > to)) return false;
    }

    return true;
  });
}

export function summarizeWorkflowRuns(
  runs: WorkflowRunRecord[],
  filters: WorkflowRunFilters = {},
): WorkflowRunSummary {
  const filteredRuns = filterWorkflowRuns(runs, filters);

  const outcomes: Record<string, number> = {};
  const completedDurations: number[] = [];
  const successDurations: number[] = [];
  const createdAts: string[] = [];

  for (const run of filteredRuns) {
    const outcome = normalizeOutcome(run.conclusion);
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;

    createdAts.push(run.createdAt);

    const durationMinutes = calculateDurationMinutes(run.createdAt, run.updatedAt);
    if (run.status === "completed" && durationMinutes !== null) {
      completedDurations.push(durationMinutes);
    }
    if (run.conclusion === "success" && durationMinutes !== null) {
      successDurations.push(durationMinutes);
    }
  }

  const observedFrom = createdAts.length
    ? [...createdAts].sort()[0] ?? null
    : null;
  const observedTo = createdAts.length
    ? [...createdAts].sort()[createdAts.length - 1] ?? null
    : null;

  return {
    total: filteredRuns.length,
    outcomes,
    durations: {
      completed: summarizeDurations(completedDurations),
      success: summarizeDurations(successDurations),
    },
    sampleWindow: {
      requestedFrom: filters.from ?? null,
      requestedTo: filters.to ?? null,
      observedFrom,
      observedTo,
    },
    filters: {
      branch: filters.branch,
      event: filters.event,
    },
  };
}

export function summarizeJobDurations(jobs: WorkflowJobRecord[]) {
  const grouped = new Map<
    string,
    { outcomes: Record<string, number>; durations: number[]; count: number }
  >();

  for (const job of jobs) {
    const bucket = grouped.get(job.name) ?? {
      outcomes: {},
      durations: [],
      count: 0,
    };

    bucket.count += 1;
    const outcome = normalizeOutcome(job.conclusion);
    bucket.outcomes[outcome] = (bucket.outcomes[outcome] ?? 0) + 1;

    const durationMinutes = calculateDurationMinutes(job.startedAt, job.completedAt);
    if (durationMinutes !== null) {
      bucket.durations.push(durationMinutes);
    }

    grouped.set(job.name, bucket);
  }

  return [...grouped.entries()]
    .map(([name, bucket]) => ({
      name,
      count: bucket.count,
      outcomes: bucket.outcomes,
      durations: summarizeDurations(bucket.durations),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    workflows: [],
    limit: 200,
    includeJobs: false,
  };

  const consumeValue = (currentIndex: number, flag: string): string => {
    const value = argv[currentIndex + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${flag}`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--":
        break;
      case "--workflow": {
        const value = consumeValue(index, arg);
        options.workflows.push(value);
        index += 1;
        break;
      }
      case "--limit": {
        const value = Number(consumeValue(index, arg));
        if (!Number.isFinite(value) || value <= 0) {
          throw new Error(`Invalid --limit value: ${String(argv[index + 1])}`);
        }
        options.limit = Math.floor(value);
        index += 1;
        break;
      }
      case "--branch":
        options.branch = consumeValue(index, arg);
        index += 1;
        break;
      case "--event":
        options.event = consumeValue(index, arg);
        index += 1;
        break;
      case "--from":
        options.from = consumeValue(index, arg);
        index += 1;
        break;
      case "--to":
        options.to = consumeValue(index, arg);
        index += 1;
        break;
      case "--repo":
        options.repository = consumeValue(index, arg);
        index += 1;
        break;
      case "--include-jobs":
        options.includeJobs = true;
        break;
      case "--no-jobs":
        options.includeJobs = false;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.workflows.length === 0) {
    throw new Error("At least one --workflow value is required.");
  }

  return options;
}

function ghJson<T>(args: string[], repository?: string): T {
  const commandArgs = [...args];
  if (repository) {
    commandArgs.push("-R", repository);
  }

  const stdout = execFileSync("gh", commandArgs, {
    encoding: "utf8",
  });
  return JSON.parse(stdout) as T;
}

function fetchWorkflowRuns(
  workflow: string,
  options: Pick<CliOptions, "limit" | "repository">,
): WorkflowRunRecord[] {
  return ghJson<WorkflowRunRecord[]>(
    [
      "run",
      "list",
      `--workflow=${workflow}`,
      `--limit=${String(options.limit)}`,
      "--json",
      "databaseId,workflowName,headBranch,event,status,conclusion,createdAt,updatedAt,headSha,url",
    ],
    options.repository,
  );
}

type GhRunViewJobsResponse = {
  jobs?: Array<{
    name: string;
    conclusion: WorkflowConclusion;
    startedAt: string | null;
    completedAt: string | null;
  }>;
};

function fetchRunJobs(runId: number, repository?: string): WorkflowJobRecord[] {
  const response = ghJson<GhRunViewJobsResponse>(
    [
      "run",
      "view",
      String(runId),
      "--json",
      "jobs",
    ],
    repository,
  );

  return (response.jobs ?? []).map((job) => ({
    name: job.name,
    conclusion: job.conclusion,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    runId,
  }));
}

async function collectWorkflowMetrics(
  options: CliOptions,
): Promise<CollectedWorkflowMetrics[]> {
  const metrics: CollectedWorkflowMetrics[] = [];

  for (const workflow of options.workflows) {
    const runs = fetchWorkflowRuns(workflow, {
      limit: options.limit,
      repository: options.repository,
    });

    const summary = summarizeWorkflowRuns(runs, {
      branch: options.branch,
      event: options.event,
      from: options.from,
      to: options.to,
    });

    let jobDurations: ReturnType<typeof summarizeJobDurations> = [];
    if (options.includeJobs) {
      const filteredRuns = filterWorkflowRuns(runs, {
        branch: options.branch,
        event: options.event,
        from: options.from,
        to: options.to,
      });

      const jobs: WorkflowJobRecord[] = [];
      for (const run of filteredRuns) {
        jobs.push(...fetchRunJobs(run.databaseId, options.repository));
      }
      jobDurations = summarizeJobDurations(jobs);
    }

    metrics.push({
      workflow,
      runCount: runs.length,
      summary,
      jobDurations,
    });
  }

  return metrics;
}

function printUsage(): void {
  console.log(`Usage:
  pnpm --filter scripts run collect-workflow-metrics -- --workflow "<name|id>" [--workflow "<name|id>"] [options]

Required:
  --workflow <value>      Workflow name or numeric workflow ID (repeatable)

Options:
  --limit <n>             Number of runs per workflow to fetch (default: 200)
  --branch <name>         Filter by head branch after fetch
  --event <event>         Filter by event after fetch (e.g. push, pull_request, schedule)
  --from <iso8601>        Filter by run createdAt >= from
  --to <iso8601>          Filter by run createdAt <= to
  --include-jobs          Fetch per-run jobs and include per-job duration stats
  --repo <owner/repo>     Optional repository override for gh calls
  --help                  Show this help
`);
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const workflows = await collectWorkflowMetrics(options);

  const payload = {
    generatedAt: new Date().toISOString(),
    repository: options.repository ?? null,
    options: {
      workflows: options.workflows,
      limit: options.limit,
      branch: options.branch ?? null,
      event: options.event ?? null,
      from: options.from ?? null,
      to: options.to ?? null,
      includeJobs: options.includeJobs,
    },
    workflows,
  };

  console.log(JSON.stringify(payload, null, 2));
}

if (process.argv[1]?.includes("collect-workflow-metrics")) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[collect-workflow-metrics] ${message}`);
    process.exitCode = 1;
  });
}
