#!/usr/bin/env node

/*
 * Agent configuration validation (CI gate).
 *
 * This script intentionally runs under plain `node` (no tsx) because CI invokes:
 *   node scripts/validate-agent-manifest.js
 *
 * It must remain deterministic and fail-closed on drift.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");

function fail(msg) {
  console.error(`[validate-agent-manifest] ERROR: ${msg}`);
  process.exit(1);
}

function assertFileExists(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(abs)) {
    fail(`Missing required file: ${relPath}`);
  }
}

function run(cmd, args) {
  try {
    execFileSync(cmd, args, {
      cwd: REPO_ROOT,
      stdio: "inherit",
      timeout: 60_000,
    });
  } catch (err) {
    const code = (err && err.status) || 1;
    process.exit(code);
  }
}

function safetyKernelPresent() {
  const safetyDoc = path.join(REPO_ROOT, "docs/git-safety.md");
  if (!fs.existsSync(safetyDoc)) return false;
  const body = fs.readFileSync(safetyDoc, "utf8");
  return (
    body.includes("```yaml baseshop-git-safety-policy") ||
    body.includes("baseshop-git-safety-policy")
  );
}

function main() {
  // Critical cross-refs (minimum bar).
  assertFileExists("AGENTS.md");
  assertFileExists("PROJECT_DIGEST.md");
  assertFileExists("docs/git-safety.md");
  assertFileExists("scripts/agents/integrator-shell.sh");
  assertFileExists("scripts/agent-bin/git");
  assertFileExists(".claude/config.json");
  assertFileExists(".claude/settings.json");
  assertFileExists(".claude/hooks/pre-tool-use-git-safety.sh");

  // Skill registry drift check.
  assertFileExists(".agents/registry/skills.json");
  run("bash", ["scripts/agents/generate-skill-registry", "--check"]);

  // Safety kernel parsing is enforced only after the kernel is introduced.
  if (safetyKernelPresent()) {
    // Fail-closed: kernel must parse and generated outputs must be in sync.
    assertFileExists("scripts/agents/generate-git-safety-policy");
    run("bash", ["scripts/agents/generate-git-safety-policy", "--check"]);
  }

  console.log("[validate-agent-manifest] OK");
}

main();
