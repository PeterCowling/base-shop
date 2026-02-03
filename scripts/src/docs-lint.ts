/* i18n-exempt file -- DOCS-2101 CLI-only docs lint messages; not end-user UI [ttl=2026-12-31] */
import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

import { parseHeader } from "./docs-lint-helpers";

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const DOCS_DIR_WITH_TRAILING = `${DOCS_DIR}${path.sep}`;

function tryGetTrackedMarkdownDocs(): string[] | null {
  try {
    const stdout = execFileSync(
      "git",
      ["ls-files", "-z", "--", "docs/**/*.md"],
      { cwd: ROOT, encoding: "utf8" },
    );
    const files = stdout
      .split("\0")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((rel) => path.join(ROOT, rel));

    return files;
  } catch {
    return null;
  }
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
]);

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
    const content = await readDocFile(file);
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
}

async function main() {
  const trackedDocs = tryGetTrackedMarkdownDocs();
  const docs = trackedDocs ?? (await walk(DOCS_DIR));
  let hadError = false;

  for (const file of docs) {
    const rel = path.relative(ROOT, file);
    const content = await readDocFile(file);
    const { type, status, domain, hasCodePointers } = parseHeader(content);

    if (!type) {
      console.warn(`[docs-lint] Missing Type header in ${rel}`);
      hadError = true;
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

    if (
      (type === "Charter" || type === "Contract") &&
      !hasCodePointers
    ) {
      console.warn(
        `[docs-lint] Missing Primary code entrypoints/Canonical code section in ${rel}`,
      );
      hadError = true;
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

  // Check dual-audience pairing for Business OS docs
  const businessOsDocs = docs.filter((file) =>
    file.includes(path.sep + "business-os" + path.sep),
  );

  for (const file of businessOsDocs) {
    const content = await readDocFile(file);
    const { type } = parseHeader(content);

    // Skip dual-audience check for Comment type (single file pattern)
    if (type === "Comment") continue;

    // Check for dual-audience pairing
    if (file.endsWith(".user.md")) {
      const agentFile = file.replace(/\.user\.md$/, ".agent.md");
      const agentExists = docs.includes(agentFile);
      if (!agentExists) {
        const rel = path.relative(ROOT, file);
        console.warn(
          `[docs-lint] Missing paired .agent.md for ${rel}`,
        );
        // Note: Not setting hadError=true for now (warn only in Phase 0)
      }
    } else if (file.endsWith(".agent.md")) {
      const userFile = file.replace(/\.agent\.md$/, ".user.md");
      const userExists = docs.includes(userFile);
      if (!userExists) {
        const rel = path.relative(ROOT, file);
        console.warn(
          `[docs-lint] Missing paired .user.md for ${rel}`,
        );
        // Note: Not setting hadError=true for now (warn only in Phase 0)
      }
    }
  }

  await buildRegistry(docs);

  if (hadError) {
    process.exitCode = 1;
  } else {
    console.log("[docs-lint] All docs passed header checks.");
  }
}

main().catch((err) => {
  console.error("[docs-lint] Unexpected error:", err);
  process.exitCode = 1;
});
