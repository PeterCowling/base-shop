/* i18n-exempt file -- DOCS-2101 CLI-only docs lint messages; not end-user UI [ttl=2026-12-31] */
import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  checkBareStageIds,
  checkRetiredMarketingSalesStageIds,
  parseHeader,
} from "./docs-lint-helpers";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const DOCS_DIR_WITH_TRAILING = `${DOCS_DIR}${path.sep}`;
const ZERO_SHA = "0000000000000000000000000000000000000000";

type DocsLintMode = "registry" | "lint";
type DocsLintScope = "all" | "changed";

export type DocsLintOptions = {
  mode: DocsLintMode;
  scope: DocsLintScope;
  includeUntracked: boolean;
  includeWorktree: boolean;
  writeRegistry: boolean;
};

function runGit(args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
  } catch {
    return null;
  }
}

function normalizeGitPathOutput(stdout: string | null, separator: "\0" | "\n"): string[] {
  if (!stdout) {
    return [];
  }

  return stdout
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((rel) => path.join(ROOT, rel));
}

function uniqueSortedPaths(paths: string[]): string[] {
  return [...new Set(paths)].sort((a, b) => a.localeCompare(b));
}

function normalizeRef(ref: string | undefined): string | null {
  if (!ref || ref === ZERO_SHA) {
    return null;
  }
  return ref;
}

function tryGetChangedMarkdownDocs(baseRef: string | null, headRef: string): string[] {
  if (!baseRef) {
    return [];
  }

  return normalizeGitPathOutput(
    runGit([
      "diff",
      "--name-only",
      "--diff-filter=ACMR",
      baseRef,
      headRef,
      "--",
      "docs/**/*.md",
    ]),
    "\n",
  );
}

function tryGetWorkingTreeMarkdownDocs(): string[] {
  return normalizeGitPathOutput(
    runGit([
      "diff",
      "--name-only",
      "--diff-filter=ACMR",
      "--",
      "docs/**/*.md",
    ]),
    "\n",
  );
}

function tryGetStagedMarkdownDocs(): string[] {
  return normalizeGitPathOutput(
    runGit([
      "diff",
      "--cached",
      "--name-only",
      "--diff-filter=ACMR",
      "--",
      "docs/**/*.md",
    ]),
    "\n",
  );
}

function tryGetUntrackedMarkdownDocs(): string[] {
  return normalizeGitPathOutput(
    runGit([
      "ls-files",
      "--others",
      "--exclude-standard",
      "--",
      "docs/**/*.md",
    ]),
    "\n",
  );
}

function tryResolveChangedBaseRef(env: NodeJS.ProcessEnv): string | null {
  return normalizeRef(env.DOCS_LINT_BASE ?? env.TURBO_SCM_BASE);
}

function resolveChangedHeadRef(env: NodeJS.ProcessEnv): string {
  return normalizeRef(env.DOCS_LINT_HEAD ?? env.TURBO_SCM_HEAD) ?? "HEAD";
}

export function resolveCliOptions(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
): DocsLintOptions {
  let mode: DocsLintMode = env.DOCS_LINT_MODE === "registry" ? "registry" : "lint";
  let scope: DocsLintScope = env.DOCS_LINT_CHANGED_ONLY === "1" ? "changed" : "all";
  let includeUntracked = env.DOCS_LINT_INCLUDE_UNTRACKED === "1";
  let includeWorktree = env.DOCS_LINT_INCLUDE_WORKTREE === "1";
  let writeRegistry = mode === "registry";

  if (env.DOCS_LINT_WRITE_REGISTRY === "1") {
    writeRegistry = true;
  }
  if (env.DOCS_LINT_WRITE_REGISTRY === "0") {
    writeRegistry = false;
  }

  for (const arg of argv.slice(2)) {
    if (arg === "--registry-only" || arg === "--mode=registry") {
      mode = "registry";
      writeRegistry = true;
      continue;
    }

    if (arg === "--mode=lint") {
      mode = "lint";
      continue;
    }

    if (arg === "--changed-only" || arg === "--scope=changed") {
      scope = "changed";
      continue;
    }

    if (arg === "--full" || arg === "--scope=all") {
      scope = "all";
      continue;
    }

    if (arg === "--write-registry") {
      writeRegistry = true;
      continue;
    }

    if (arg === "--include-worktree") {
      includeWorktree = true;
      continue;
    }

    if (arg === "--include-untracked") {
      includeUntracked = true;
      continue;
    }

    if (arg === "--no-include-untracked") {
      includeUntracked = false;
      continue;
    }

    if (arg === "--no-include-worktree") {
      includeWorktree = false;
      continue;
    }

    if (arg === "--no-write-registry") {
      writeRegistry = false;
      continue;
    }

    throw new Error(`[docs-lint] Unknown argument: ${arg}`);
  }

  if (mode === "registry") {
    writeRegistry = true;
  }

  return { mode, scope, includeUntracked, includeWorktree, writeRegistry };
}

function docsPath(target: string): string {
  const resolved = path.resolve(DOCS_DIR, target);
  if (resolved !== DOCS_DIR && !resolved.startsWith(DOCS_DIR_WITH_TRAILING)) {
    throw new Error(`[docs-lint] Refusing to access path outside docs/: ${target}`);
  }
  return resolved;
}

async function readDocsDir(dir: string) {
  const normalized = docsPath(dir);

  return fs.readdir(normalized, { withFileTypes: true });
}

async function readDocFile(filePath: string) {
  const normalized = docsPath(filePath);

  return fs.readFile(normalized, "utf8");
}

async function writeDocFile(filePath: string, content: string) {
  const normalized = docsPath(filePath);

  return fs.writeFile(normalized, content, "utf8");
}

const ALLOWED_STATUSES = new Set([
  "Canonical",
  "Active",
  "Draft",
  "Reference",
  "Historical",
  "Superseded",
  "Proposed",
  "Accepted",
  "Rejected",
  "Archive",
  "Archived",
  "Complete",
  "Ready-for-analysis",
  "Ready-for-planning",
  "Needs-input",
  "Infeasible",
]);

const TYPE_HEADER_OPTIONAL_PATH_SUFFIXES = new Set([
  "docs/business-os/startup-loop/_generated/stage-operator-table.md",
  "docs/plans/webpack-removal-v2/critique-history.md",
]);

const STARTUP_LOOP_NO_LEGACY_STAGE_DOCS = new Set([
  "docs/business-os/startup-loop-workflow.user.md",
  "docs/business-os/workflow-prompts/README.user.md",
]);

function isTypeHeaderOptionalDoc(rel: string): boolean {
  return TYPE_HEADER_OPTIONAL_PATH_SUFFIXES.has(rel.split(path.sep).join("/"));
}

function isArchivedPlanDoc(rel: string): boolean {
  const normalized = rel.split(path.sep).join("/");
  return (
    normalized.startsWith("docs/plans/_archive/") ||
    normalized.startsWith("docs/historical/plans/")
  );
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === "ENOENT"
  );
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readDocsDir(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = docsPath(path.join(dir, entry.name));
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

async function buildRegistry(docs: string[]) {
  const entries = [];
  for (const file of docs) {
    const rel = path.relative(ROOT, file);
    if (isArchivedPlanDoc(rel)) {
      continue;
    }
    let content: string;
    try {
      content = await readDocFile(file);
    } catch (error) {
      if (isMissingFileError(error)) {
        console.warn(`[docs-lint] Skipping missing doc in registry build: ${rel}`);
        continue;
      }
      throw error;
    }
    const header = parseHeader(content);
    if (!header.type) continue;
    entries.push({
      path: rel,
      type: header.type,
      status: header.status,
      domain: header.domain,
    });
  }
  await writeDocFile("registry.json", JSON.stringify(entries, null, 2));
  return entries.length;
}

function selectDocsForScope(
  allDocs: string[],
  options: DocsLintOptions,
  env: NodeJS.ProcessEnv,
): string[] {
  if (options.scope === "all") {
    return allDocs;
  }

  const baseRef = tryResolveChangedBaseRef(env);
  const headRef = resolveChangedHeadRef(env);
  const existingDocs = new Set(allDocs);
  const worktreeDocs = options.includeWorktree ? tryGetWorkingTreeMarkdownDocs() : [];
  const untrackedDocs = options.includeUntracked ? tryGetUntrackedMarkdownDocs() : [];
  const changedDocs = uniqueSortedPaths([
    ...tryGetChangedMarkdownDocs(baseRef, headRef),
    ...tryGetStagedMarkdownDocs(),
    ...worktreeDocs,
    ...untrackedDocs,
  ]).filter((file) => existingDocs.has(file));

  return changedDocs;
}

async function validateDocs(docs: string[], allDocsSet: Set<string>) {
  let hadError = false;

  for (const file of docs) {
    const rel = path.relative(ROOT, file);
    let content: string;
    try {
      content = await readDocFile(file);
    } catch (error) {
      if (isMissingFileError(error)) {
        console.warn(`[docs-lint] Skipping missing doc: ${rel}`);
        continue;
      }
      throw error;
    }
    const { type, status, domain, hasCodePointers } = parseHeader(content);

    if (!type) {
      console.warn(`[docs-lint] Missing Type header in ${rel}`);
      if (!isTypeHeaderOptionalDoc(rel)) {
        hadError = true;
      }
      continue;
    }

    if (!status) {
      console.warn(`[docs-lint] Missing Status header in ${rel}`);
      hadError = true;
    } else if (!ALLOWED_STATUSES.has(status)) {
      console.warn(
        `[docs-lint] Non-standard Status "${status}" in ${rel} (allowed: ${[
          ...ALLOWED_STATUSES,
        ].join(", ")})`,
      );
    }

    if ((type === "Charter" || type === "Contract") && !domain) {
      console.warn(`[docs-lint] Missing Domain header in ${rel}`);
      hadError = true;
    }

    if ((type === "Charter" || type === "Contract") && !hasCodePointers) {
      console.warn(
        `[docs-lint] Missing Primary code entrypoints/Canonical code section in ${rel}`,
      );
      hadError = true;
    }

    // Stage-label adjacency check for startup-loop docs (warn-level).
    // Flags bare canonical stage IDs (e.g. "SELL-01") used in prose without an adjacent
    // human-readable label. Scoped to startup-loop docs to avoid noise elsewhere.
    const relParts = rel.split(path.sep);
    const isStartupLoopDoc = relParts.includes("startup-loop");
    const relNormalized = rel.split(path.sep).join("/");
    if (isStartupLoopDoc) {
      const bareIdViolations = checkBareStageIds(content);
      for (const violation of bareIdViolations) {
        console.warn(`[docs-lint] ${rel}: ${violation}`);
        // warn-level only during Phase 0 rollout; not setting hadError
      }
    }

    if (STARTUP_LOOP_NO_LEGACY_STAGE_DOCS.has(relNormalized)) {
      const retiredIdViolations = checkRetiredMarketingSalesStageIds(content);
      for (const violation of retiredIdViolations) {
        console.warn(`[docs-lint] ${rel}: ${violation}`);
        hadError = true;
      }
    }

    // Business OS type validations (only for files in business-os directory)
    const isBusinessOsDoc = rel.includes(path.sep + "business-os" + path.sep);

    if (isBusinessOsDoc) {
      const {
        business,
        owner,
        id,
        lane,
        priority,
        cardId,
        author,
        created,
        lastReviewed,
        lastUpdated,
      } = parseHeader(content);

      if (type === "Idea") {
        if (!business) {
          console.warn(`[docs-lint] Missing Business header in ${rel}`);
          hadError = true;
        }
        if (!owner) {
          console.warn(`[docs-lint] Missing Owner header in ${rel}`);
        }
        if (!id) {
          console.warn(`[docs-lint] Missing ID header in ${rel}`);
          hadError = true;
        }
      }

      if (type === "Card") {
        if (!business) {
          console.warn(`[docs-lint] Missing Business header in ${rel}`);
          hadError = true;
        }
        if (!lane) {
          console.warn(`[docs-lint] Missing Lane header in ${rel}`);
          hadError = true;
        }
        if (!priority) {
          console.warn(`[docs-lint] Missing Priority header in ${rel}`);
          hadError = true;
        }
        if (!owner) {
          console.warn(`[docs-lint] Missing Owner header in ${rel}`);
        }
        if (!id) {
          console.warn(`[docs-lint] Missing ID header in ${rel}`);
          hadError = true;
        }
        if (!created) {
          console.warn(`[docs-lint] Missing Created header in ${rel}`);
          hadError = true;
        }
        if (!lastUpdated) {
          console.warn(`[docs-lint] Missing Last-updated header in ${rel}`);
        }
      }

      if (
        type === "Fact-Find" ||
        type === "Build-Log" ||
        type === "Reflection"
      ) {
        if (!cardId) {
          console.warn(`[docs-lint] Missing Card-ID header in ${rel}`);
          hadError = true;
        }
      }

      // Note: "Plan" type inside business-os means card-level plan (stage doc)
      // Generic Plan type outside business-os is feature plan and doesn't need Card-ID
      if (type === "Plan" && rel.includes("/cards/")) {
        if (!cardId) {
          console.warn(`[docs-lint] Missing Card-ID header in ${rel}`);
          hadError = true;
        }
      }

      if (type === "Comment") {
        if (!author) {
          console.warn(`[docs-lint] Missing Author header in ${rel}`);
          hadError = true;
        }
        if (!created) {
          console.warn(`[docs-lint] Missing Created header in ${rel}`);
          hadError = true;
        }
        if (!cardId) {
          console.warn(`[docs-lint] Missing Card-ID header in ${rel}`);
          hadError = true;
        }
      }

      if (type === "Business-Plan") {
        if (!business) {
          console.warn(`[docs-lint] Missing Business header in ${rel}`);
          hadError = true;
        }
        if (!lastReviewed) {
          console.warn(`[docs-lint] Missing Last-reviewed header in ${rel}`);
          hadError = true;
        }
      }

      if (type === "People") {
        if (!lastReviewed) {
          console.warn(`[docs-lint] Missing Last-reviewed header in ${rel}`);
          hadError = true;
        }
      }
    }
  }

  // Hygiene check for standing .user.md docs in startup-baselines/ and strategy/
  // Warning mode for existing docs (pre-2026-02-22); does not set hadError.
  // Suppressed for docs containing <!-- HYGIENE-EXEMPT: ... -->.
  const HYGIENE_CUTOFF_DATE = "2026-02-22";
  const HYGIENE_DIRS = [
    path.join("docs", "business-os", "startup-baselines"),
    path.join("docs", "business-os", "strategy"),
  ];
  const hygieneTargets = docs.filter((file) => {
    const rel = path.relative(ROOT, file);
    return (
      rel.endsWith(".user.md") &&
      HYGIENE_DIRS.some((dir) => rel.startsWith(dir + path.sep) || rel.startsWith(dir + "/"))
    );
  });

  for (const file of hygieneTargets) {
    const rel = path.relative(ROOT, file);
    let hygieneContent: string;
    try {
      hygieneContent = await readDocFile(file);
    } catch (error) {
      if (isMissingFileError(error)) continue;
      throw error;
    }

    // Check for HYGIENE-EXEMPT suppression comment
    if (/<!--\s*HYGIENE-EXEMPT\s*:/.test(hygieneContent)) continue;

    const hasOwner = /^Owner:[ \t]*\S/m.test(hygieneContent);
    const hasReviewTrigger = /^Review-trigger:[ \t]*\S/m.test(hygieneContent);

    if (!hasOwner || !hasReviewTrigger) {
      // Determine if this doc was created after the cutoff date (hard-fail for new docs)
      // We check the Last-updated or Created frontmatter date to detect new docs.
      // Docs without a date are treated as pre-cutoff (warn-only).
      const { created, lastUpdated } = parseHeader(hygieneContent);
      const docDate = lastUpdated ?? created ?? null;
      const isNewDoc = docDate !== null && docDate >= HYGIENE_CUTOFF_DATE;

      if (!hasOwner) {
        console.warn(`[docs-lint] [hygiene] Missing Owner: field in ${rel}`);
        if (isNewDoc) hadError = true;
      }
      if (!hasReviewTrigger) {
        console.warn(`[docs-lint] [hygiene] Missing Review-trigger: field in ${rel}`);
        if (isNewDoc) hadError = true;
      }
    }
  }

  // Check dual-audience pairing for Business OS docs
  const businessOsDocs = docs.filter((file) =>
    file.includes(path.sep + "business-os" + path.sep),
  );

  for (const file of businessOsDocs) {
    let content: string;
    try {
      content = await readDocFile(file);
    } catch (error) {
      if (isMissingFileError(error)) {
        continue;
      }
      throw error;
    }
    const { type } = parseHeader(content);

    // Skip dual-audience check for Comment type (single file pattern)
    if (type === "Comment") continue;

    // Check for dual-audience pairing
    if (file.endsWith(".user.md")) {
      const agentFile = file.replace(/\.user\.md$/, ".agent.md");
      const agentExists = allDocsSet.has(agentFile);
      if (!agentExists) {
        const rel = path.relative(ROOT, file);
        console.warn(
          `[docs-lint] Missing paired .agent.md for ${rel}`,
        );
        // Note: Not setting hadError=true for now (warn only in Phase 0)
      }
    } else if (file.endsWith(".agent.md")) {
      const userFile = file.replace(/\.agent\.md$/, ".user.md");
      const userExists = allDocsSet.has(userFile);
      if (!userExists) {
        const rel = path.relative(ROOT, file);
        console.warn(
          `[docs-lint] Missing paired .user.md for ${rel}`,
        );
        // Note: Not setting hadError=true for now (warn only in Phase 0)
      }
    }
  }

  return hadError;
}

async function main() {
  const options = resolveCliOptions(process.argv);
  const allDocs = uniqueSortedPaths(await walk(DOCS_DIR));

  if (options.writeRegistry) {
    const entryCount = await buildRegistry(allDocs);
    console.log(`[docs-lint] Wrote docs/registry.json with ${entryCount} entries.`);
  }

  if (options.mode === "registry") {
    return;
  }

  const docs = selectDocsForScope(allDocs, options, process.env);
  if (docs.length === 0) {
    console.log(
      options.scope === "changed"
        ? "[docs-lint] No changed docs detected; skipping checks."
        : "[docs-lint] No docs detected; skipping checks.",
    );
    return;
  }

  const allDocsSet = new Set(allDocs);
  const hadError = await validateDocs(docs, allDocsSet);

  if (hadError) {
    process.exitCode = 1;
  } else {
    console.log(
      options.scope === "changed"
        ? "[docs-lint] Changed docs passed header checks."
        : "[docs-lint] All docs passed header checks.",
    );
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((err) => {
    console.error("[docs-lint] Unexpected error:", err);
    process.exitCode = 1;
  });
}
