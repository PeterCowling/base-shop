/* i18n-exempt file -- ENG-2402 CLI-only plan fix script, not user-facing UI [ttl=2026-12-31] */
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");

type PlanHeader = {
  type: string | null;
  status: string | null;
  domain: string | null;
  lastReviewed: string | null;
  relatesToCharter: string | null;
};

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
    if (line.startsWith("- **")) {
      tasks.push(line);
    }
  }
  return tasks;
}

async function fixPlanFile(file: string) {
  const content = await fs.readFile(file, "utf8");
  const header = parseHeader(content);

  if (header.type !== "Plan") return false;

  let modified = false;
  let newContent = content;

  // Check if we need to add missing headers
  const needsStatusDomainReviewed = !header.status || !header.domain || !header.lastReviewed;
  const needsRelatesToCharter = !header.relatesToCharter;

  if (needsStatusDomainReviewed || needsRelatesToCharter) {
    // Parse the frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const lines = frontmatter.split("\n");

      // Find the position to insert new headers (after Type, before or at the end)
      let insertIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("Type:")) {
          insertIndex = i + 1;
          break;
        }
      }

      if (insertIndex === -1) insertIndex = 0;

      // Add missing headers
      const newLines: string[] = [];

      if (!header.status) {
        newLines.push("Status: Active");
      }
      if (!header.domain) {
        newLines.push("Domain: General");
      }
      if (!header.lastReviewed) {
        const today = new Date().toISOString().split("T")[0];
        newLines.push(`Last-reviewed: ${today}`);
      }

      // Insert after Status/Domain/Last-reviewed if they exist, otherwise after Type
      let charterInsertIndex = insertIndex;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("Last-reviewed:") ||
            lines[i].startsWith("Domain:") ||
            lines[i].startsWith("Status:")) {
          charterInsertIndex = i + 1;
        }
      }

      if (!header.relatesToCharter) {
        lines.splice(charterInsertIndex, 0, "Relates-to charter: none");
        modified = true;
      }

      if (newLines.length > 0) {
        lines.splice(insertIndex, 0, ...newLines);
        modified = true;
      }

      if (modified) {
        const newFrontmatter = lines.join("\n");
        newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);
      }
    }
  }

  // Check if we need to add "## Active tasks" section
  if (!hasActiveTasksSection(newContent)) {
    // Find a good place to insert it - after the first major heading and summary
    const lines = newContent.split("\n");
    let insertIndex = -1;

    // Look for the end of the frontmatter and first heading section
    let passedFrontmatter = false;
    let passedFirstHeading = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line === "---" && !passedFrontmatter) {
        passedFrontmatter = true;
        continue;
      }
      if (line === "---" && passedFrontmatter && !passedFirstHeading) {
        continue;
      }

      if (line.startsWith("# ") && passedFrontmatter) {
        passedFirstHeading = true;
        continue;
      }

      // Insert after first substantial section or before first ## heading
      if (passedFirstHeading && (line.startsWith("## ") || (i > 0 && lines[i-1].trim() === "" && line.trim() === ""))) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) {
      // If no good spot found, add at the end
      insertIndex = lines.length;
    }

    // Insert the Active tasks section
    const activeTasksSection = [
      "",
      "## Active tasks",
      "",
      "No active tasks at this time.",
      ""
    ];

    lines.splice(insertIndex, 0, ...activeTasksSection);
    newContent = lines.join("\n");
    modified = true;
  }

  // Check if Active tasks section exists but is empty
  if (hasActiveTasksSection(newContent)) {
    const tasks = parseTasks(newContent);
    if (tasks.length === 0) {
      // Check if it already has "No active tasks" or similar text
      const activeTasksSectionMatch = newContent.match(/## Active tasks\n+([\s\S]*?)(?=\n## |\n---|\Z)/);
      if (activeTasksSectionMatch) {
        const sectionContent = activeTasksSectionMatch[1].trim();
        if (!sectionContent || sectionContent.length < 5) {
          // Replace empty section with placeholder
          newContent = newContent.replace(
            /## Active tasks\n+[\s\S]*?(?=\n## |\n---|\Z)/,
            "## Active tasks\n\nNo active tasks at this time.\n\n"
          );
          modified = true;
        }
      }
    }
  }

  if (modified) {
    await fs.writeFile(file, newContent, "utf8");
    return true;
  }

  return false;
}

async function main() {
  const docs = await walk(DOCS_DIR);
  const planFiles = docs.filter((f) => {
    const rel = path.relative(ROOT, f);
    return rel.endsWith(".md");
  });

  let fixedCount = 0;

  for (const file of planFiles) {
    const rel = path.relative(ROOT, file);
    // Skip legacy CMS thread plans and fast-launch master thread
    if (
      rel.startsWith("docs/cms-plan/thread-") ||
      rel.endsWith("docs/cms-plan/master-thread.fast-launch.md")
    ) {
      continue;
    }

    try {
      const fixed = await fixPlanFile(file);
      if (fixed) {
        console.log(`✓ Fixed: ${rel}`);
        fixedCount++;
      }
    } catch (err) {
      console.error(`✗ Error fixing ${rel}:`, err);
    }
  }

  console.log(`\n[fix-plan-headers] Fixed ${fixedCount} plan files.`);
}

main().catch((err) => {
  console.error("[fix-plan-headers] Unexpected error:", err);
  process.exitCode = 1;
});
