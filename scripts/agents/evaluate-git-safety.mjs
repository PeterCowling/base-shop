#!/usr/bin/env node
/**
 * Git safety evaluator (shared semantics).
 *
 * Used by scripts/agent-bin/git (argv-based guard). Hook wiring is deferred.
 *
 * Exit codes:
 *   0: allow
 *   1: deny / ask (non-interactive => deny)
 *   2: internal error (fail-closed => deny)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function failClosed(msg, err) {
  const detail = err ? `\n\nDetails: ${String(err?.stack || err)}` : "";
  console.error("------------------------------------------------------------------");
  console.error("GIT COMMAND BLOCKED (agent guard)");
  console.error("------------------------------------------------------------------");
  console.error("");
  console.error("Reason: evaluator failure (fail-closed)");
  console.error("");
  console.error(msg);
  if (detail) console.error(detail);
  console.error("");
  console.error("Reference: docs/git-safety.md");
  console.error("");
  process.exit(1);
}

function parseCli(argv) {
  let policyPath = null;
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === "--") {
      return { policyPath, gitArgs: argv.slice(i + 1) };
    }
    if (a === "--policy" && i + 1 < argv.length) {
      policyPath = argv[i + 1];
      i += 2;
      continue;
    }
    i += 1;
  }
  return { policyPath, gitArgs: [] };
}

function repoRootFromRuntime() {
  const envRoot = process.env.BASESHOP_GUARD_REPO_ROOT;
  if (envRoot) return envRoot;
  // scripts/agents/evaluate-git-safety.mjs -> scripts/agents -> scripts -> repo root
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
}

function readPolicyJson(policyPath) {
  const raw = fs.readFileSync(policyPath, "utf8");
  return JSON.parse(raw);
}

function shellEscape(s) {
  if (/^[A-Za-z0-9_.,/:@%+=-]+$/.test(s)) return s;
  return `'${String(s).replace(/'/g, `'\"'\"'`)}'`;
}

function gitSubcommandIndex(argv) {
  // Skip only the global options we care about (-c key=value).
  // Anything ambiguous is treated conservatively downstream (matchers should fail).
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "-c") {
      i += 1;
      continue;
    }
    if (a.startsWith("-")) continue;
    return i;
  }
  return -1;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function anyFlagMatchesRegex(args, patterns) {
  const regexes = patterns.map((p) => new RegExp(p));
  for (const a of args) {
    if (!a.startsWith("-")) continue;
    for (const r of regexes) {
      if (r.test(a)) return true;
    }
  }
  return false;
}

function anyArgMatchesRegex(args, patterns) {
  const regexes = patterns.map((p) => new RegExp(p));
  for (const a of args) {
    for (const r of regexes) {
      if (r.test(a)) return true;
    }
  }
  return false;
}

function gitArgsAfterSubcommand(argv) {
  const idx = gitSubcommandIndex(argv);
  if (idx === -1) return { subcommand: "", tail: [] };
  return { subcommand: argv[idx], tail: argv.slice(idx + 1) };
}

function parseCheckoutPathspecs(tail) {
  const sep = tail.indexOf("--");
  if (sep === -1) return [];
  return tail.slice(sep + 1);
}

function parseRestorePathspecs(tail) {
  const sep = tail.indexOf("--");
  if (sep !== -1) return tail.slice(sep + 1);

  const pathspecs = [];
  const optionsWithValues = new Set([
    "--source",
    "--pathspec-from-file",
    "-s",
    "--conflict",
  ]);

  let skipNext = false;
  for (let i = 0; i < tail.length; i += 1) {
    const a = tail[i];
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (optionsWithValues.has(a)) {
      skipNext = true;
      continue;
    }
    if (a.startsWith("--source=") || a.startsWith("--pathspec-from-file=") || a.startsWith("--conflict=")) {
      continue;
    }
    if (a.startsWith("-")) continue;
    pathspecs.push(a);
  }
  return pathspecs;
}

function pathspecIsBulkOrRepoWide(p) {
  if (p === "." || p === ":/" || p === ":/." || p === ":/*") return true;
  if (p.endsWith("/")) return true;
  if (p.includes("*") || p.includes("?") || p.includes("[") || p.includes(":(glob)")) return true;
  return false;
}

function gitHooksPathBypass(argv) {
  // git -c core.hooksPath=/dev/null ...
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] !== "-c") continue;
    const next = argv[i + 1] || "";
    if (next.startsWith("core.hooksPath=")) return true;
  }

  // git config core.hooksPath /dev/null  (but allow reads like: git config --get core.hooksPath)
  const { subcommand, tail } = gitArgsAfterSubcommand(argv);
  if (subcommand !== "config") return false;

  const isRead =
    tail.includes("--get") ||
    tail.includes("--get-all") ||
    tail.includes("--name-only") ||
    tail.includes("--show-origin");
  if (isRead) return false;

  for (let i = 0; i < tail.length; i += 1) {
    const a = tail[i];
    if (a === "core.hooksPath") {
      const val = tail[i + 1];
      if (val && !val.startsWith("-")) return true;
    }
    if (a.startsWith("core.hooksPath=")) return true;
  }

  return false;
}

function gitConfigSetsKey(argv, key) {
  const { subcommand, tail } = gitArgsAfterSubcommand(argv);
  if (subcommand !== "config") return false;

  const isRead =
    tail.includes("--get") ||
    tail.includes("--get-all") ||
    tail.includes("--name-only") ||
    tail.includes("--show-origin");
  if (isRead) return false;

  for (let i = 0; i < tail.length; i += 1) {
    const a = tail[i];
    if (a === key) {
      const val = tail[i + 1];
      if (val && !val.startsWith("-")) return true;
    }
    if (a.startsWith(`${key}=`)) return true;
  }
  return false;
}

function gitStashMutation(argv, rule) {
  const { subcommand, tail } = gitArgsAfterSubcommand(argv);
  if (subcommand !== "stash") return false;

  const stashSub = tail[0] || "";
  if (!stashSub) return Boolean(rule.denyBare);
  if (Array.isArray(rule.allowSubcommands) && rule.allowSubcommands.includes(stashSub)) return false;
  if (Array.isArray(rule.denySubcommands) && rule.denySubcommands.includes(stashSub)) return true;
  return Boolean(rule.denyUnknown);
}

function checkoutRestoreBulkDiscards(argv) {
  const { subcommand, tail } = gitArgsAfterSubcommand(argv);
  if (subcommand !== "checkout" && subcommand !== "restore") return false;

  if (subcommand === "checkout") {
    const pathspecs = parseCheckoutPathspecs(tail);
    if (pathspecs.length <= 0) return false;
    if (pathspecs.length > 1) return true;
    return pathspecIsBulkOrRepoWide(pathspecs[0]);
  }

  // restore
  const hasStaged = tail.includes("--staged");
  const hasWorktree = tail.includes("--worktree");
  const affectsWorktree = !(hasStaged && !hasWorktree);
  if (!affectsWorktree) return false;

  const pathspecs = parseRestorePathspecs(tail);
  if (pathspecs.length <= 0) return false;
  if (pathspecs.length > 1) return true;
  return pathspecIsBulkOrRepoWide(pathspecs[0]);
}

function matchRule(rule, ctx) {
  const m = rule.match || {};
  switch (m.kind) {
    case "env_var": {
      const names = Array.isArray(m.names) ? m.names : [];
      return names.some((n) => ctx.env[String(n)] === "1");
    }
    case "argv_regex_any": {
      const patterns = Array.isArray(m.patterns) ? m.patterns.map(String) : [];
      return anyArgMatchesRegex(ctx.argv, patterns);
    }
    case "git_hooks_path": {
      return gitHooksPathBypass(ctx.argv);
    }
    case "git_config_set_key": {
      const key = String(m.key || "");
      if (!key) return false;
      return gitConfigSetsKey(ctx.argv, key);
    }
    case "git_stash": {
      return gitStashMutation(ctx.argv, m);
    }
    case "git_checkout_restore_pathspecs": {
      return checkoutRestoreBulkDiscards(ctx.argv);
    }
    case "git_argv": {
      const { subcommand, tail } = gitArgsAfterSubcommand(ctx.argv);
      if (!subcommand) return false;
      if (String(m.subcommand || "") !== subcommand) return false;

      const flagsAny = Array.isArray(m.flagsAny) ? m.flagsAny.map(String) : [];
      const flagsNone = Array.isArray(m.flagsNone) ? m.flagsNone.map(String) : [];
      const flagsRegexAny = Array.isArray(m.flagsRegexAny) ? m.flagsRegexAny.map(String) : [];
      const argsAnyRegex = Array.isArray(m.argsAnyRegex) ? m.argsAnyRegex.map(String) : [];

      for (const f of flagsAny) {
        if (hasFlag(tail, f)) return true;
      }
      for (const f of flagsNone) {
        if (hasFlag(tail, f)) return false;
      }
      if (flagsRegexAny.length > 0 && anyFlagMatchesRegex(tail, flagsRegexAny)) return true;
      if (argsAnyRegex.length > 0 && anyArgMatchesRegex(tail, argsAnyRegex)) return true;
      if (flagsAny.length === 0 && flagsRegexAny.length === 0 && argsAnyRegex.length === 0) {
        // Subcommand-only rule.
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

function evaluate(policy, ctx) {
  const rules = Array.isArray(policy.rules) ? policy.rules : [];
  const evalSem = policy.evaluation || {
    resolution: "priority_then_first_match",
    defaultEffect: "allow",
    askBehavior: "deny_if_noninteractive",
  };

  const ordered = [...rules];
  if (evalSem.resolution === "priority_then_first_match") {
    ordered.sort((a, b) => (Number(b.priority || 0) - Number(a.priority || 0)));
  }

  for (const r of ordered) {
    if (!r || typeof r !== "object") continue;
    if (!matchRule(r, ctx)) continue;
    return { matched: r, effect: r.effect || "deny", evalSem };
  }

  return { matched: null, effect: evalSem.defaultEffect || "allow", evalSem };
}

function main() {
  const { policyPath: cliPolicyPath, gitArgs } = parseCli(process.argv.slice(2));

  const repoRoot = repoRootFromRuntime();
  const policyPath = cliPolicyPath || path.join(repoRoot, ".agents/safety/generated/git-safety-policy.json");

  let policy;
  try {
    policy = readPolicyJson(policyPath);
  } catch (err) {
    failClosed(`Failed to read policy: ${policyPath}`, err);
    return;
  }

  const ctx = { argv: gitArgs, env: process.env };

  let result;
  try {
    result = evaluate(policy, ctx);
  } catch (err) {
    failClosed("Policy evaluation threw an exception.", err);
    return;
  }

  let effect = String(result.effect || "deny");
  if (effect === "ask" && result.evalSem?.askBehavior === "deny_if_noninteractive") {
    effect = "deny";
  }

  if (effect === "allow") process.exit(0);

  const ruleId = result.matched?.id ? String(result.matched.id) : "(no-match)";
  const rationale = result.matched?.rationale ? String(result.matched.rationale) : "Blocked by policy.";

  console.error("------------------------------------------------------------------");
  console.error("GIT COMMAND BLOCKED (agent guard)");
  console.error("------------------------------------------------------------------");
  console.error("");
  console.error(`Rule: ${ruleId}`);
  console.error(`Reason: ${rationale}`);
  console.error("");
  console.error("Command:");
  console.error(`  git ${gitArgs.map(shellEscape).join(" ")}`.trimEnd());
  console.error("");
  console.error("Reference: docs/git-safety.md");
  console.error("");
  process.exit(1);
}

main();

