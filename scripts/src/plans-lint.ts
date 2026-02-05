 
/* i18n-exempt file -- ENG-2402 CLI-only plan lint output, not user-facing UI [ttl=2026-12-31] */
import { promises as fs } from "fs";
import path from "path";

type PlanHeader = {
  type: string | null;
  status: string | null;
  domain: string | null;
  lastReviewed: string | null;
  relatesToCharter: string | null;
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
  const lines = content.split(/\r?\n/).slice(0, 40);
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
  };
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
      inActive = line.trim().toLowerCase() === "## active tasks";
      continue;
    }
    if (!inActive) continue;
    // Skip phase/section headings (e.g., "### Phase 1", "### Implementation")
    if (line.match(/^###\s+(Phase|Implementation|Background|Context|Overview)/i)) {
      continue;
    }
    // Accept both list-based tasks (- **ID: or - [x] ID:) and heading-based tasks (### ID:)
    if (line.match(/^- (\[[ x]\] )?[A-Z0-9-]+-\d+/) || line.match(/^### [A-Z0-9-]+-\d+/)) {
      tasks.push(line);
    }
  }
  return tasks;
}

function validateTaskLine(line: string, rel: string): string[] {
  const errors: string[] = [];
  // Task lines should already be filtered to have valid IDs by parseTasks()
  // This validation is mainly a sanity check
  const listMatch = line.match(/^- (\[[ x]\] )?[A-Z0-9-]+-\d+/);
  const headingMatch = line.match(/^### [A-Z0-9-]+-\d+/);
  if (!listMatch && !headingMatch) {
    errors.push(
      `[plans-lint] ${rel}: task line does not match expected format: ${line.trim()}`,
    );
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

    if (!header.status || !header.domain || !header.lastReviewed) {
      console.warn(
        `[plans-lint] ${rel}: Plan missing Status/Domain/Last-reviewed header`,
      );
      hadError = true;
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

    if (!hasActiveTasksSection(content)) {
      console.warn(
        `[plans-lint] ${rel}: Plan missing "## Active tasks" section`,
      );
      hadError = true;
      continue;
    }

    const tasks = parseTasks(content);
    if (tasks.length === 0) {
      console.warn(
        `[plans-lint] ${rel}: Plan has no tasks under "## Active tasks"`,
      );
      // Not an error yet; just warn.
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
