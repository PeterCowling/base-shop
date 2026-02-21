#!/usr/bin/env node

/**
 * CLI wrapper for S2 Operator Capture Orchestrator.
 *
 * This is an ESM wrapper around the TypeScript implementation to provide
 * a direct executable entry point.
 */

import { parseArgs, orchestrate } from "./dist/startup-loop/s2-operator-capture.js";

const args = parseArgs(process.argv.slice(2));
orchestrate(args).catch((err) => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
