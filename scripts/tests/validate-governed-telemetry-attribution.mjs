#!/usr/bin/env node

import fs from "node:fs";

function fail(message) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = {
    eventsFile: "",
    noAssert: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--events-file":
      case "--events":
        options.eventsFile = String(argv[++i] ?? "");
        break;
      case "--no-assert":
        options.noAssert = true;
        break;
      default:
        fail(`unknown argument ${arg}`);
    }
  }

  if (!options.eventsFile) {
    fail("missing required --events-file argument");
  }

  return options;
}

function readEvents(eventsFile) {
  if (!fs.existsSync(eventsFile)) {
    fail(`events file not found: ${eventsFile}`);
  }
  const lines = fs
    .readFileSync(eventsFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      fail(`invalid JSONL at line ${index + 1}`);
    }
  });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function evaluate(events) {
  const governed = events.filter((event) => event.governed === true);
  const missingSession = governed.filter((event) => !isNonEmptyString(event.session_id));
  const invalidCallerPid = governed.filter((event) => !isPositiveInteger(event.caller_pid));

  const summary = {
    governed_events: governed.length,
    session_id_missing: missingSession.length,
    caller_pid_invalid: invalidCallerPid.length,
    pass: missingSession.length === 0 && invalidCallerPid.length === 0,
  };

  return summary;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const events = readEvents(options.eventsFile);
  const summary = evaluate(events);

  process.stdout.write(`${JSON.stringify(summary)}\n`);

  if (!options.noAssert && !summary.pass) {
    process.exit(1);
  }
}

main();
