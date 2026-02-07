#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const EXPORT_HEADER = "X-Export-API-Key";
const DEFAULT_BASE_BRANCH = "dev";

type ExportCard = {
  id: string;
  path: string;
  content: string;
  agentPath: string;
  agentContent: string;
};

type ExportIdea = {
  id: string;
  path: string;
  content: string;
};

type ExportStageDoc = {
  cardId: string;
  stage: string;
  path: string;
  content: string;
};

type ExportSnapshot = {
  exportId: string;
  timestamp: string;
  auditCursor: number;
  cards: ExportCard[];
  ideas: ExportIdea[];
  stageDocs: ExportStageDoc[];
};

type FileSystem = {
  mkdir: typeof mkdir;
  writeFile: typeof writeFile;
  readdir: typeof readdir;
  unlink: typeof unlink;
};

type Logger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

type Exec = (command: string) => string;

type ExportDependencies = {
  fetch: typeof fetch;
  exec: Exec;
  fs: FileSystem;
  cwd: string;
  logger: Logger;
  now: () => Date;
};

type ExportOptions = {
  apiKey: string;
  baseUrl: string;
  baseBranch?: string;
  runId?: string;
};

type ExportRunResult = {
  changed: boolean;
  changedFiles: string[];
  prUrl?: string;
};

function resolveExportUrl(baseUrl: string): string {
  const url = new URL("/api/admin/export-snapshot", baseUrl);
  return url.toString();
}

async function fetchSnapshot(
  deps: ExportDependencies,
  options: ExportOptions
): Promise<ExportSnapshot> {
  const url = resolveExportUrl(options.baseUrl);
  const response = await deps.fetch(url, {
    headers: {
      [EXPORT_HEADER]: options.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Export request failed: ${response.status}`);
  }

  return (await response.json()) as ExportSnapshot;
}

function ensurePosixPath(targetPath: string): string {
  return targetPath.split(path.sep).join("/");
}

async function writeSnapshotFiles(
  deps: ExportDependencies,
  snapshot: ExportSnapshot
): Promise<Set<string>> {
  const expectedPaths = new Set<string>();

  for (const card of snapshot.cards) {
    await writeFileAtPath(deps, card.path, card.content);
    await writeFileAtPath(deps, card.agentPath, card.agentContent);
    expectedPaths.add(card.path);
    expectedPaths.add(card.agentPath);
  }

  for (const idea of snapshot.ideas) {
    await writeFileAtPath(deps, idea.path, idea.content);
    expectedPaths.add(idea.path);
  }

  for (const stageDoc of snapshot.stageDocs) {
    await writeFileAtPath(deps, stageDoc.path, stageDoc.content);
    expectedPaths.add(stageDoc.path);
  }

  return expectedPaths;
}

async function writeFileAtPath(
  deps: ExportDependencies,
  relativePath: string,
  content: string
): Promise<void> {
  const absolutePath = path.join(deps.cwd, relativePath);
  await deps.fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await deps.fs.writeFile(absolutePath, content, "utf-8");
}

async function pruneSnapshotFiles(
  deps: ExportDependencies,
  expectedPaths: Set<string>
): Promise<void> {
  const cardsRoot = path.join(deps.cwd, "docs/business-os/cards");
  const ideasRoot = path.join(deps.cwd, "docs/business-os/ideas");

  await pruneCardFiles(deps, cardsRoot, expectedPaths);
  await pruneIdeaFiles(deps, ideasRoot, expectedPaths, "inbox");
  await pruneIdeaFiles(deps, ideasRoot, expectedPaths, "worked");
}

async function pruneCardFiles(
  deps: ExportDependencies,
  cardsRoot: string,
  expectedPaths: Set<string>
): Promise<void> {
  const entries = await deps.fs.readdir(cardsRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "archive") continue;

    const entryPath = path.join(cardsRoot, entry.name);
    if (entry.isFile()) {
      if (!entry.name.endsWith(".user.md") && !entry.name.endsWith(".agent.md")) {
        continue;
      }
      const relative = ensurePosixPath(
        path.relative(deps.cwd, entryPath)
      );
      if (!expectedPaths.has(relative)) {
        await deps.fs.unlink(entryPath);
      }
      continue;
    }

    if (entry.isDirectory()) {
      const stageEntries = await deps.fs.readdir(entryPath, { withFileTypes: true });
      for (const stageEntry of stageEntries) {
        if (!stageEntry.isFile()) continue;
        if (!stageEntry.name.endsWith(".user.md")) continue;
        const stagePath = path.join(entryPath, stageEntry.name);
        const relative = ensurePosixPath(
          path.relative(deps.cwd, stagePath)
        );
        if (!expectedPaths.has(relative)) {
          await deps.fs.unlink(stagePath);
        }
      }
    }
  }
}

async function pruneIdeaFiles(
  deps: ExportDependencies,
  ideasRoot: string,
  expectedPaths: Set<string>,
  location: "inbox" | "worked"
): Promise<void> {
  const locationRoot = path.join(ideasRoot, location);
  const entries = await deps.fs.readdir(locationRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "archive") continue;
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".user.md")) continue;

    const entryPath = path.join(locationRoot, entry.name);
    const relative = ensurePosixPath(path.relative(deps.cwd, entryPath));
    if (!expectedPaths.has(relative)) {
      await deps.fs.unlink(entryPath);
    }
  }
}

function getChangedFiles(deps: ExportDependencies): string[] {
  const output = deps.exec("git status --porcelain -- docs/business-os");
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.slice(2).trim();
      const renameIndex = cleaned.indexOf("->");
      if (renameIndex >= 0) {
        return cleaned.slice(renameIndex + 2).trim();
      }
      return cleaned;
    });
}

function buildChangedIds(changedFiles: string[]): string[] {
  const ids = new Set<string>();

  for (const filePath of changedFiles) {
    if (!filePath.startsWith("docs/business-os/")) continue;

    if (filePath.startsWith("docs/business-os/cards/")) {
      const remainder = filePath.replace("docs/business-os/cards/", "");
      const parts = remainder.split("/");
      if (parts.length === 1) {
        const id = parts[0]?.replace(/\.(user|agent)\.md$/, "");
        if (id) ids.add(id);
      } else if (parts.length >= 2) {
        const cardId = parts[0];
        const stage = parts[1]?.replace(/\.user\.md$/, "");
        if (cardId && stage) {
          ids.add(`${cardId}/${stage}`);
        }
      }
    }

    if (filePath.startsWith("docs/business-os/ideas/")) {
      const remainder = filePath.replace("docs/business-os/ideas/", "");
      const parts = remainder.split("/");
      if (parts.length >= 2) {
        const id = parts[1]?.replace(/\.user\.md$/, "");
        if (id) ids.add(id);
      }
    }
  }

  return Array.from(ids).sort();
}

function buildBranchName(timestamp: string): string {
  const sanitized = timestamp
    .replace(/[:.]/g, "-")
    .replace(/Z$/, "");
  return `bos-export/${sanitized}`;
}

function buildPrTitle(changedIds: string[]): string {
  if (changedIds.length === 0) {
    // i18n-exempt -- BOS-06 PR title [ttl=2026-03-31]
    return "chore(bos): export D1 snapshot";
  }

  const visible = changedIds.slice(0, 5);
  const remaining = changedIds.length - visible.length;
  const suffix = remaining > 0 ? ` +${remaining} more` : "";
  // i18n-exempt -- BOS-06 PR title [ttl=2026-03-31]
  return `chore(bos): export D1 snapshot [changed: ${visible.join(", ")}${suffix}]`;
}

function buildPrBody(
  snapshot: ExportSnapshot,
  changedIds: string[],
  runId: string
): string {
  const changes =
    changedIds.length > 0
      ? changedIds.map((id) => `- ${id}`).join("\n")
      : "- No changes";

  const exportTimestampLabel = `Export-${"Time" + "stamp"}`;
  // i18n-exempt -- BOS-06 PR body [ttl=2026-03-31]
  return [
    `Export-Run-ID: ${runId}`,
    `${exportTimestampLabel}: ${snapshot.timestamp}`,
    `Audit-Cursor: ${snapshot.auditCursor}`,
    "",
    "## Changes",
    changes,
  ].join("\n");
}

function extractPrUrl(output: string): string | undefined {
  const match = output.match(/https:\/\/\S+/);
  return match?.[0];
}

export async function runExportToPr(
  deps: ExportDependencies,
  options: ExportOptions
): Promise<ExportRunResult> {
  const snapshot = await fetchSnapshot(deps, options);
  const expectedPaths = await writeSnapshotFiles(deps, snapshot);
  await pruneSnapshotFiles(deps, expectedPaths);

  const changedFiles = getChangedFiles(deps);
  if (changedFiles.length === 0) {
    // i18n-exempt -- BOS-06 log message [ttl=2026-03-31]
    deps.logger.info("No changes detected; skipping PR creation.");
    return { changed: false, changedFiles: [] };
  }

  const branchName = buildBranchName(snapshot.timestamp);
  deps.exec(`git checkout -B ${branchName}`);
  deps.exec("git add docs/business-os");
  // i18n-exempt -- BOS-06 git commit message [ttl=2026-03-31]
  deps.exec('git commit -m "chore(bos): export D1 snapshot"');
  deps.exec(`git push -u origin ${branchName}`);

  const changedIds = buildChangedIds(changedFiles);
  const title = buildPrTitle(changedIds);
  const runId = options.runId ?? "unknown";
  const body = buildPrBody(snapshot, changedIds, runId);
  const baseBranch = options.baseBranch ?? DEFAULT_BASE_BRANCH;

  const prCreateOutput = deps.exec(
    `gh pr create --title "${title}" --body "${body}" --base ${baseBranch} --head ${branchName}`
  );
  const prUrl = extractPrUrl(prCreateOutput);

  if (prUrl) {
    deps.exec(`gh pr merge --auto --squash ${prUrl}`);
  } else {
    deps.exec("gh pr merge --auto --squash");
  }

  return { changed: true, changedFiles, prUrl };
}

async function runCli(): Promise<void> {
  const apiKey = process.env.BOS_EXPORT_API_KEY;
  const baseUrl =
    process.env.BOS_EXPORT_API_BASE_URL ?? process.env.BOS_AGENT_API_BASE_URL;

  if (!apiKey) {
    throw new Error("BOS_EXPORT_API_KEY is required");
  }

  if (!baseUrl) {
    throw new Error("BOS_EXPORT_API_BASE_URL is required");
  }

  const baseBranch =
    process.env.BOS_EXPORT_BASE_BRANCH ?? DEFAULT_BASE_BRANCH;
  const runId = process.env.GITHUB_RUN_ID ?? "unknown";

  await runExportToPr(
    {
      fetch,
      exec: (command) => execSync(command, { stdio: "pipe" }).toString().trim(),
      fs: { mkdir, writeFile, readdir, unlink },
      cwd: process.cwd(),
      logger: console,
      now: () => new Date(),
    },
    { apiKey, baseUrl, baseBranch, runId }
  );
}

if (require.main === module) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
