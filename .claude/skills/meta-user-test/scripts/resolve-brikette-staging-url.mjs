#!/usr/bin/env node

import { execSync } from "node:child_process";
import process from "node:process";

const DEFAULTS = {
  workflow: "Deploy Brikette",
  branch: "staging",
  maxWaitSeconds: 1800,
  pollSeconds: 20,
  repo: "PeterCowling/base-shop",
  path: "/en",
};

function parseArgs(argv) {
  const args = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--workflow" && next) {
      args.workflow = next;
      i += 1;
      continue;
    }
    if (token === "--branch" && next) {
      args.branch = next;
      i += 1;
      continue;
    }
    if (token === "--repo" && next) {
      args.repo = next;
      i += 1;
      continue;
    }
    if (token === "--max-wait-seconds" && next) {
      args.maxWaitSeconds = Number(next);
      i += 1;
      continue;
    }
    if (token === "--poll-seconds" && next) {
      args.pollSeconds = Number(next);
      i += 1;
      continue;
    }
    if (token === "--path" && next) {
      args.path = next.startsWith("/") ? next : `/${next}`;
      i += 1;
      continue;
    }
  }

  if (!Number.isFinite(args.maxWaitSeconds) || args.maxWaitSeconds < 0) {
    throw new Error("--max-wait-seconds must be a non-negative number");
  }
  if (!Number.isFinite(args.pollSeconds) || args.pollSeconds < 1) {
    throw new Error("--poll-seconds must be >= 1");
  }

  return args;
}

function runJson(command) {
  const raw = execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 30,
  });
  return JSON.parse(raw);
}

function sleep(seconds) {
  execSync(`sleep ${seconds}`);
}

function getLatestRun({ repo, workflow, branch }) {
  const encodedWorkflow = workflow.replaceAll('"', '\\"');
  const command = [
    "gh run list",
    `--repo ${repo}`,
    `--workflow "${encodedWorkflow}"`,
    `--branch ${branch}`,
    "--limit 1",
    "--json databaseId,status,conclusion,headSha,createdAt,url,displayTitle",
  ].join(" ");

  const runs = runJson(command);
  if (!Array.isArray(runs) || runs.length === 0) {
    throw new Error(`No workflow runs found for ${workflow} on branch ${branch}`);
  }
  return runs[0];
}

function waitForCompletion({ repo, runId, maxWaitSeconds, pollSeconds }) {
  const start = Date.now();
  while (true) {
    const run = runJson(
      `gh run view ${runId} --repo ${repo} --json databaseId,status,conclusion,headSha,url,workflowName`,
    );

    if (run.status === "completed") {
      if (run.conclusion !== "success") {
        throw new Error(
          `Latest run ${runId} completed with conclusion=${run.conclusion}. Cannot resolve fresh staging URL.`,
        );
      }
      return run;
    }

    const elapsed = Math.floor((Date.now() - start) / 1000);
    if (elapsed >= maxWaitSeconds) {
      throw new Error(
        `Timed out waiting for run ${runId} to complete (waited ${elapsed}s, max ${maxWaitSeconds}s).`,
      );
    }

    process.stderr.write(
      `[resolve-brikette-staging-url] waiting for run ${runId} (status=${run.status}) elapsed=${elapsed}s\n`,
    );
    sleep(pollSeconds);
  }
}

function extractLatestImmutableUrl(logText, pathSuffix) {
  const matches = [
    ...logText.matchAll(/https:\/\/([a-z0-9-]+)\.brikette-website\.pages\.dev\b/gi),
  ];
  const hosts = [];
  for (const match of matches) {
    const host = String(match[1] || "").toLowerCase();
    if (!host || host === "staging") continue;
    if (!hosts.includes(host)) hosts.push(host);
  }
  if (hosts.length === 0) return null;
  const latest = hosts[hosts.length - 1];
  return `https://${latest}.brikette-website.pages.dev${pathSuffix}`;
}

function extractLatestImmutableUrlFromRunArchive({ repo, runId, pathSuffix }) {
  const command = [
    "tmpdir=$(mktemp -d)",
    `gh api repos/${repo}/actions/runs/${runId}/logs > "$tmpdir/logs.zip"`,
    `unzip -q "$tmpdir/logs.zip" -d "$tmpdir/logs"`,
    `rg --no-filename -o "https://[a-z0-9-]+\\\\.brikette-website\\\\.pages\\\\.dev" "$tmpdir/logs" || true`,
    "rm -rf \"$tmpdir\"",
  ].join(" && ");

  const urlsRaw = execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 20,
  });

  return extractLatestImmutableUrl(urlsRaw, pathSuffix);
}

async function assertReachable(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const initialRun = getLatestRun(args);
  const completedRun =
    initialRun.status === "completed" && initialRun.conclusion === "success"
      ? initialRun
      : waitForCompletion({
          repo: args.repo,
          runId: initialRun.databaseId,
          maxWaitSeconds: args.maxWaitSeconds,
          pollSeconds: args.pollSeconds,
        });

  const url = extractLatestImmutableUrlFromRunArchive({
    repo: args.repo,
    runId: completedRun.databaseId,
    pathSuffix: args.path,
  });
  if (!url) {
    throw new Error(
      `No immutable Pages URL found in logs for run ${completedRun.databaseId}.`,
    );
  }

  await assertReachable(url);

  process.stdout.write(
    JSON.stringify(
      {
        url,
        runId: completedRun.databaseId,
        runUrl: completedRun.url,
        headSha: completedRun.headSha,
      },
      null,
      2,
    ),
  );
  process.stdout.write("\n");
}

main().catch((error) => {
  process.stderr.write(`[resolve-brikette-staging-url] ${error.message}\n`);
  process.exit(1);
});
