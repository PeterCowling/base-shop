/* i18n-exempt file -- DOCS-2101 CLI-only docs lint messages; not end-user UI [ttl=2026-12-31] */
import { promises as fs } from "fs";
import path from "path";

type DocHeader = {
  type: string | null;
  status: string | null;
  domain: string | null;
  hasCodePointers: boolean;
};

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const DOCS_DIR_WITH_TRAILING = `${DOCS_DIR}${path.sep}`;

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

function parseHeader(content: string): DocHeader {
  const lines = content.split(/\r?\n/).slice(0, 40);
  const get = (prefix: string) => {
    const line = lines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() || null : null;
  };
  const type = get("Type:");
  const status = get("Status:");
  const domain = get("Domain:");
  const hasCodePointers = lines.some(
    (l) =>
      l.startsWith("Primary code entrypoints:") ||
      l.startsWith("Canonical code:"),
  );
  return { type, status, domain, hasCodePointers };
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
  const docs = await walk(DOCS_DIR);
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
