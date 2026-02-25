#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { mean as libMean, percentile as libPercentile } from "@acme/lib";

function fail(message) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = {
    eventsFile: "",
    jsonOut: "",
    mdOut: "",
    reportPath: "",
    label: "synthetic-day-zero",
    minGovernedSamples: 30,
    minGovernedClasses: 3,
    minContentionSamples: 5,
    requireClasses: ["governed-jest", "governed-turbo", "governed-changed"],
    assertGates: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--events-file":
      case "--events":
        options.eventsFile = argv[++i] ?? "";
        break;
      case "--json-out":
        options.jsonOut = argv[++i] ?? "";
        break;
      case "--md-out":
        options.mdOut = argv[++i] ?? "";
        break;
      case "--report-path":
        options.reportPath = argv[++i] ?? "";
        break;
      case "--label":
        options.label = argv[++i] ?? "synthetic-day-zero";
        break;
      case "--min-governed-samples":
        options.minGovernedSamples = Number(argv[++i] ?? "30");
        break;
      case "--min-governed-classes":
        options.minGovernedClasses = Number(argv[++i] ?? "3");
        break;
      case "--min-contention-samples":
        options.minContentionSamples = Number(argv[++i] ?? "5");
        break;
      case "--require-classes": {
        const raw = argv[++i] ?? "";
        options.requireClasses = raw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .sort();
        break;
      }
      case "--no-assert-gates":
        options.assertGates = false;
        break;
      default:
        fail(`unknown argument `);
    }
  }

  if (!options.eventsFile) {
    fail("missing required --events-file argument");
  }
  if (!Number.isFinite(options.minGovernedSamples) || options.minGovernedSamples < 0) {
    fail("--min-governed-samples must be a non-negative number");
  }
  if (!Number.isFinite(options.minGovernedClasses) || options.minGovernedClasses < 0) {
    fail("--min-governed-classes must be a non-negative number");
  }
  if (!Number.isFinite(options.minContentionSamples) || options.minContentionSamples < 0) {
    fail("--min-contention-samples must be a non-negative number");
  }

  return options;
}

function ensureParent(filePath) {
  if (!filePath) {
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }
  try {
    const result = libPercentile(values, p);
    return Number.isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }
  const result = libMean(values);
  if (!Number.isFinite(result)) {
    return 0;
  }
  return Number(result.toFixed(2));
}

function parseEvents(eventsFile) {
  if (!fs.existsSync(eventsFile)) {
    fail(`events file not found: ${eventsFile}`);
  }

  const rawLines = fs
    .readFileSync(eventsFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const events = [];
  for (const line of rawLines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      fail(`invalid JSONL event: ${line.slice(0, 120)}`);
    }
  }
  return events;
}

function buildSummary(events, options) {
  const governedEvents = events.filter((event) => event.governed === true);
  const governedClasses = [...new Set(governedEvents.map((event) => event.class).filter(Boolean))].sort();
  const queueValues = governedEvents
    .map((event) => Number(event.queued_ms))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const classSummaries = governedClasses.map((eventClass) => {
    const classEvents = governedEvents.filter((event) => event.class === eventClass);
    const classQueue = classEvents
      .map((event) => Number(event.queued_ms))
      .filter((value) => Number.isFinite(value) && value >= 0);
    const classWorkers = classEvents
      .map((event) => Number(event.workers))
      .filter((value) => Number.isFinite(value) && value >= 0);
    const nonZeroExitCount = classEvents.filter((event) => Number(event.exit_code) !== 0).length;
    const contentionSamples = classQueue.filter((value) => value > 0).length;

    return {
      class: eventClass,
      samples: classEvents.length,
      contention_samples: contentionSamples,
      avg_workers: average(classWorkers),
      p95_queued_ms: percentile(classQueue, 95),
      max_queued_ms: classQueue.length > 0 ? Math.max(...classQueue) : 0,
      non_zero_exit_count: nonZeroExitCount,
    };
  });

  const latestTimestamp = governedEvents
    .map((event) => String(event.ts ?? ""))
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  const queueContentionSamples = queueValues.filter((value) => value > 0).length;
  const overrideOverloadTrue = governedEvents.filter(
    (event) => event.override_overload_used === true,
  ).length;
  const overridePolicyTrue = governedEvents.filter(
    (event) => event.override_policy_used === true,
  ).length;

  const missingRequiredClasses = options.requireClasses.filter(
    (required) => !governedClasses.includes(required),
  );

  const gates = {
    min_governed_samples: {
      required: options.minGovernedSamples,
      actual: governedEvents.length,
      pass: governedEvents.length >= options.minGovernedSamples,
    },
    min_governed_classes: {
      required: options.minGovernedClasses,
      actual: governedClasses.length,
      pass: governedClasses.length >= options.minGovernedClasses,
    },
    min_contention_samples: {
      required: options.minContentionSamples,
      actual: queueContentionSamples,
      pass: queueContentionSamples >= options.minContentionSamples,
    },
    required_classes_present: {
      required: options.requireClasses,
      actual: governedClasses,
      pass: missingRequiredClasses.length === 0,
      missing: missingRequiredClasses,
    },
  };

  const failedGateNames = Object.entries(gates)
    .filter(([, gate]) => gate.pass !== true)
    .map(([name]) => name)
    .sort();

  return {
    label: options.label,
    generated_at: latestTimestamp,
    source_events_file: options.eventsFile,
    source_events_total: events.length,
    governed_events_considered: governedEvents.length,
    ungoverned_events_excluded: events.length - governedEvents.length,
    class_summaries: classSummaries,
    queue: {
      contention_samples: queueContentionSamples,
      non_contention_samples: queueValues.filter((value) => value === 0).length,
      p50_queued_ms: percentile(queueValues, 50),
      p95_queued_ms: percentile(queueValues, 95),
      max_queued_ms: queueValues.length > 0 ? Math.max(...queueValues) : 0,
    },
    overrides: {
      overload_true: overrideOverloadTrue,
      overload_false: governedEvents.length - overrideOverloadTrue,
      policy_true: overridePolicyTrue,
      policy_false: governedEvents.length - overridePolicyTrue,
    },
    gates: {
      pass: failedGateNames.length === 0,
      failed: failedGateNames,
      details: gates,
    },
  };
}

function summaryToMarkdown(summary) {
  const lines = [];
  lines.push("## Day-Zero Synthetic Calibration Baseline");
  lines.push("");
  lines.push("> Evidence tag: synthetic-day-zero (governed harness)");
  lines.push("");
  lines.push(`- Label: \`${summary.label}\``);
  lines.push(`- Generated-at (latest governed event): \`${summary.generated_at ?? "unknown"}\``);
  lines.push(`- Source events file: \`${summary.source_events_file}\``);
  lines.push(`- Governed events considered: **${summary.governed_events_considered}**`);
  lines.push(`- Ungoverned events excluded: **${summary.ungoverned_events_excluded}**`);
  lines.push("");
  lines.push("### Class Distribution");
  lines.push("");
  lines.push("| Class | Samples | Contention | Avg Workers | P95 queued ms | Max queued ms | Non-zero exits |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const item of summary.class_summaries) {
    lines.push(
      `| ${item.class} | ${item.samples} | ${item.contention_samples} | ${item.avg_workers} | ${item.p95_queued_ms} | ${item.max_queued_ms} | ${item.non_zero_exit_count} |`,
    );
  }
  lines.push("");
  lines.push("### Queue Metrics");
  lines.push("");
  lines.push(`- Contention samples (queued_ms > 0): **${summary.queue.contention_samples}**`);
  lines.push(`- Non-contention samples (queued_ms = 0): **${summary.queue.non_contention_samples}**`);
  lines.push(`- P50 queued ms: **${summary.queue.p50_queued_ms}**`);
  lines.push(`- P95 queued ms: **${summary.queue.p95_queued_ms}**`);
  lines.push(`- Max queued ms: **${summary.queue.max_queued_ms}**`);
  lines.push("");
  lines.push("### Override Usage");
  lines.push("");
  lines.push(`- overload override true: **${summary.overrides.overload_true}**`);
  lines.push(`- overload override false: **${summary.overrides.overload_false}**`);
  lines.push(`- bypass-policy override true: **${summary.overrides.policy_true}**`);
  lines.push(`- bypass-policy override false: **${summary.overrides.policy_false}**`);
  lines.push("");
  lines.push("### Gate Evaluation");
  lines.push("");
  lines.push(`- Pass: **${summary.gates.pass}**`);
  if (summary.gates.failed.length > 0) {
    lines.push(`- Failed gates: ${summary.gates.failed.join(", ")}`);
  } else {
    lines.push("- Failed gates: none");
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writeOutputs(summary, markdown, options) {
  const serialized = `${JSON.stringify(summary, null, 2)}\n`;

  if (options.jsonOut) {
    ensureParent(options.jsonOut);
    fs.writeFileSync(options.jsonOut, serialized);
  }

  if (options.mdOut) {
    ensureParent(options.mdOut);
    fs.writeFileSync(options.mdOut, markdown);
  }

  if (options.reportPath) {
    ensureParent(options.reportPath);
    const prefix = fs.existsSync(options.reportPath)
      ? fs.readFileSync(options.reportPath, "utf8").replace(/\s*$/, "")
      : "# Test Execution Resource Governor Calibration\n\n";
    const content = `${prefix}\n\n${markdown}`;
    fs.writeFileSync(options.reportPath, content);
  }

  process.stdout.write(serialized);
}

const options = parseArgs(process.argv.slice(2));
const events = parseEvents(options.eventsFile);
const summary = buildSummary(events, options);
const markdown = summaryToMarkdown(summary);

writeOutputs(summary, markdown, options);

if (options.assertGates && !summary.gates.pass) {
  process.exit(1);
}
