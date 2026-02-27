 
/* i18n-exempt file -- ENG-2402 CLI-only plan lint output, not user-facing UI [ttl=2026-12-31] */
import { promises as fs } from "fs";
import path from "path";

type PlanHeader = {
  type: string | null;
  status: string | null;
  domain: string | null;
  lastReviewed: string | null;
  relatesToCharter: string | null;
  executionTrack: string | null;
  primaryExecutionSkill: string | null;
  deliverableType: string | null;
  featureSlug: string | null;
  workstream: string | null;
};

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function parseHeader(content: string): PlanHeader {
  const lines = content.split(/\r?\n/).slice(0, 60);
  const get = (prefix: string) => {
    const line = lines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() || null : null;
  };
  return {
    type: get("Type:"),
    status: get("Status:"),
    domain: get("Domain:"),
    lastReviewed: get("Last-reviewed:"),
    relatesToCharter: get("Relates-to charter:"),
    executionTrack: get("Execution-Track:"),
    primaryExecutionSkill: get("Primary-Execution-Skill:"),
    deliverableType: get("Deliverable-Type:"),
    featureSlug: get("Feature-Slug:"),
    workstream: get("Workstream:"),
  };
}

type TaskBlock = { id: string; body: string };

function parseImplementTaskBlocks(content: string): TaskBlock[] {
  // Split on ### headings; collect blocks whose Type field is IMPLEMENT
  const chunks = content.split(/^(?=### )/m);
  const blocks: TaskBlock[] = [];
  for (const chunk of chunks) {
    const headingMatch = chunk.match(/^### \*{0,2}([A-Z0-9-]+-\d+)/);
    if (!headingMatch) continue;
    // Only IMPLEMENT tasks
    if (!/^\*{0,2}Type\*{0,2}:\s*IMPLEMENT\b/im.test(chunk)) continue;
    blocks.push({ id: headingMatch[1], body: chunk });
  }
  return blocks;
}

function validateImplementTask(
  id: string,
  body: string,
  rel: string,
): string[] {
  const errors: string[] = [];
  if (!/^\*{0,2}Confidence\*{0,2}:/im.test(body)) {
    errors.push(
      `[plans-lint] ${rel}: ${id}: IMPLEMENT task missing Confidence section`,
    );
  }
  // Validation contract: heading present OR at least one TC-/VC- reference
  if (
    !/^\*{0,2}Validation contract\*{0,2}:/im.test(body) &&
    !/\b[TV]C-\d+/i.test(body)
  ) {
    errors.push(
      `[plans-lint] ${rel}: ${id}: IMPLEMENT task missing Validation contract (no TC-/VC- reference found)`,
    );
  }
  if (!/^\*{0,2}Acceptance criteria\*{0,2}:/im.test(body)) {
    errors.push(
      `[plans-lint] ${rel}: ${id}: IMPLEMENT task missing Acceptance criteria`,
    );
  }
  return errors;
}

async function fileExists(rel: string): Promise<boolean> {
  try {
    const p = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function hasCharterType(rel: string): Promise<boolean> {
  if (!(await fileExists(rel))) return false;
  const p = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
  const buf = await fs.readFile(p, "utf8");
  const header = parseHeader(buf);
  // Accept either a Charter or a Contract as the anchor for plans.
  return header.type === "Charter" || header.type === "Contract";
}

function hasActiveTasksSection(content: string): boolean {
  return /^## Active tasks/m.test(content);
}

function parseTasks(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const tasks: string[] = [];
  let inActive = false;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      inActive = line.trim().toLowerCase().startsWith("## active tasks");
      continue;
    }
    if (!inActive) continue;
    // Skip phase/section headings (e.g., "### Phase 1", "### Implementation")
    if (line.match(/^###\s+(Phase|Implementation|Background|Context|Overview)/i)) {
      continue;
    }
    // Accept both list-based tasks (- **ID: or - [x] ID:) and heading-based tasks (### ID:)
    // Allow optional markdown bold (**) around task IDs
    if (
      line.match(/^- (\[[ x]\] )?\*{0,2}[A-Z0-9-]+-\d+/) ||
      line.match(/^### \*{0,2}[A-Z0-9-]+-\d+/)
    ) {
      tasks.push(line);
    }
  }
  return tasks;
}

function validateTaskLine(line: string, rel: string): string[] {
  const errors: string[] = [];
  // Task lines should already be filtered to have valid IDs by parseTasks()
  // This validation is mainly a sanity check
  const listMatch = line.match(/^- (\[[ x]\] )?\*{0,2}[A-Z0-9-]+-\d+/);
  const headingMatch = line.match(/^### \*{0,2}[A-Z0-9-]+-\d+/);
  if (!listMatch && !headingMatch) {
    errors.push(
      `[plans-lint] ${rel}: task line does not match expected format: ${line.trim()}`,
    );
  }
  return errors;
}

// Local Jest command patterns that should not appear in active plan/doc files
// under the CI-only test execution policy. Each entry is a [pattern, label] pair.
const LOCAL_JEST_PATTERNS: [RegExp, string][] = [
  [/\bnpx jest\b/i, "npx jest"],
  [/\bpnpm exec jest\b/i, "pnpm exec jest"],
  [/\bpnpm run test:governed\b/i, "pnpm run test:governed (local invocation)"],
  [/\bVALIDATE_INCLUDE_TESTS=1\b/, "VALIDATE_INCLUDE_TESTS=1"],
];

// Files that are exempt from the local-Jest lint rule because they document
// historical patterns or are the resource governor artifacts themselves.
const LOCAL_JEST_PATTERN_EXEMPTIONS = [
  "docs/plans/test-execution-resource-governor",
  "docs/historical/",
  "docs/plans/_archive/",
  "docs/plans/archive/",
];

function checkLocalJestPatterns(content: string, rel: string): string[] {
  // Inline exemption marker: <!-- LINT-EXEMPT: local-jest-pattern -->
  if (/<!--\s*LINT-EXEMPT:\s*local-jest-pattern\s*-->/.test(content)) {
    return [];
  }
  // Path-based exemptions
  for (const exempt of LOCAL_JEST_PATTERN_EXEMPTIONS) {
    if (rel.startsWith(exempt)) return [];
  }
  const errors: string[] = [];
  for (const [pattern, label] of LOCAL_JEST_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(
        `[plans-lint] ${rel}: active plan contains local test command pattern "${label}" — tests run in CI only (BASESHOP_CI_ONLY_TESTS=1). Add <!-- LINT-EXEMPT: local-jest-pattern --> to exempt intentional historical references.`,
      );
    }
  }
  return errors;
}

async function main() {
  const docs = await walk(DOCS_DIR);
  const planFiles = docs.filter((f) => {
    const rel = path.relative(ROOT, f);
    return rel.endsWith(".md");
  });

  let hadError = false;

  for (const file of planFiles) {
    const rel = path.relative(ROOT, file);
    // Skip legacy CMS thread plans and fast-launch master thread for now.
    if (
      rel.startsWith("docs/cms-plan/thread-") ||
      rel.endsWith("docs/cms-plan/master-thread.fast-launch.md")
    ) {
      continue;
    }
    const content = await fs.readFile(file, "utf8");
    const header = parseHeader(content);
    if (header.type !== "Plan") continue;

    // Archive/historical plans are exempt from metadata completeness checks.
    // Detected by terminal status OR path containing /historical/ or /archive/ or /_archive/.
    const terminalStatuses = new Set([
      "Historical",
      "Complete",
      "Superseded",
      "Accepted",
      "Archived",
      "Done",
    ]);
    const isTerminal =
      (header.status && terminalStatuses.has(header.status)) ||
      rel.includes("/historical/") ||
      rel.includes("/archive/") ||
      rel.includes("_archive/");

    // Planning-specific checks (frontmatter fields + IMPLEMENT task completeness) apply only to
    // modern lp-do-workflow plans at docs/plans/<slug>/plan.md. Legacy flat plans (docs/*.md,
    // docs/cms-plan/*.md, etc.) predate this schema and are not required to carry these fields.
    const isLpDoPlan = /^docs\/plans\/[^/]+\/plan\.md$/.test(rel);

    if (!isTerminal) {
      if (!header.status || !header.domain || !header.lastReviewed) {
        console.warn(
          `[plans-lint] ${rel}: Plan missing Status/Domain/Last-reviewed header`,
        );
        hadError = true;
      }

      // Planning-specific frontmatter required for lp-do-workflow plans only
      if (isLpDoPlan) {
        const missingPlanningFields: string[] = [];
        if (!header.executionTrack)
          missingPlanningFields.push("Execution-Track");
        if (!header.primaryExecutionSkill)
          missingPlanningFields.push("Primary-Execution-Skill");
        if (!header.deliverableType)
          missingPlanningFields.push("Deliverable-Type");
        if (!header.featureSlug) missingPlanningFields.push("Feature-Slug");
        if (!header.workstream) missingPlanningFields.push("Workstream");
        if (missingPlanningFields.length > 0) {
          console.warn(
            `[plans-lint] ${rel}: Plan missing planning frontmatter fields: ${missingPlanningFields.join(", ")}`,
          );
          hadError = true;
        }
      }

      if (!header.relatesToCharter) {
        console.warn(
          `[plans-lint] ${rel}: Plan missing Relates-to charter header`,
        );
        hadError = true;
      } else if (header.relatesToCharter.toLowerCase() === "none") {
        // "none" is a valid explicit acknowledgment that the plan doesn't relate to a charter
        // This is acceptable for repo-level or cross-cutting plans
      } else {
        const ok = await hasCharterType(header.relatesToCharter);
        if (!ok) {
          console.warn(
            `[plans-lint] ${rel}: Relates-to charter does not point to a Charter/Contract doc: ${header.relatesToCharter}`,
          );
          // Treat as a warning for now; do not fail CI solely on this.
        }
      }

      // IMPLEMENT task structural completeness — lp-do-workflow plans only
      if (isLpDoPlan) {
        const implTasks = parseImplementTaskBlocks(content);
        for (const task of implTasks) {
          const errs = validateImplementTask(task.id, task.body, rel);
          if (errs.length) {
            hadError = true;
            errs.forEach((e) => console.warn(e));
          }
        }
      }

      // CI-only test policy: active plan docs must not contain local Jest command patterns.
      const jestPatternErrs = checkLocalJestPatterns(content, rel);
      if (jestPatternErrs.length) {
        hadError = true;
        jestPatternErrs.forEach((e) => console.warn(e));
      }
    }

    if (!hasActiveTasksSection(content)) {
      if (!isTerminal) {
        console.warn(
          `[plans-lint] ${rel}: Plan missing "## Active tasks" section`,
        );
        hadError = true;
      }
      continue;
    }

    const tasks = parseTasks(content);
    if (tasks.length === 0) {
      // Also suppress when the section explicitly states there are no active tasks
      const activeSection = content
        .split(/^## Active tasks/m)[1]
        ?.split(/^## /m)[0]
        ?.toLowerCase();
      const explicitlyEmpty =
        activeSection &&
        /no active tasks|all (tasks )?complete|see .* section/.test(
          activeSection,
        );
      if (!isTerminal && !explicitlyEmpty) {
        console.warn(
          `[plans-lint] ${rel}: Plan has no tasks under "## Active tasks"`,
        );
      }
    }
    for (const line of tasks) {
      const errs = validateTaskLine(line, rel);
      if (errs.length) {
        hadError = true;
        errs.forEach((e) => console.warn(e));
      }
    }
  }

  if (hadError) {
    process.exitCode = 1;
  } else {
    console.log("[plans-lint] All plans passed basic structure checks.");
  }
}

main().catch((err) => {
  console.error("[plans-lint] Unexpected error:", err);
  process.exitCode = 1;
});
