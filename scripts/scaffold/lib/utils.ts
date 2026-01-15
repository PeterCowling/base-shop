import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { GuideArea, GuideManifestEntryInput, GuideStatus } from "../../../src/routes/guides/guide-manifest";
import {
  CHECKLIST_ITEM_IDS,
  createGuideManifestEntry,
  formatGuideManifestEntry,
  guideManifest,
} from "../../../src/routes/guides/guide-manifest";

export type GuideWorkflowStatus = "draft" | "review" | "published";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function kebab(input: string): string {
  return input
    .trim()
    .replace(/[^A-Za-z0-9\s\-_.]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toPascalCase(value: string): string {
  return value
    .split(/[-_]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toManifestStatus(status?: GuideWorkflowStatus | "live"): GuideStatus {
  if (!status) return "draft";
  if (status === "published" || status === "live") return "live";
  if (status === "review") return "review";
  return "draft";
}

export function toIndexStatus(status?: GuideWorkflowStatus | "live"): GuideWorkflowStatus {
  if (status === "published" || status === "live") return "published";
  if (status === "review") return "review";
  return "draft";
}

export function normalizeGuideArea(area?: GuideArea): GuideArea {
  if (area === "howToGetHere" || area === "help" || area === "experience") return area;
  return "experience";
}

export function buildDefaultChecklist(): NonNullable<GuideManifestEntryInput["checklist"]> {
  return CHECKLIST_ITEM_IDS.map((id) => ({
    id,
    status: id === "content" ? "inProgress" : "missing",
  })) as NonNullable<GuideManifestEntryInput["checklist"]>;
}

export function buildManifestEntrySource(entry: GuideManifestEntryInput): string {
  const formattedLines = formatGuideManifestEntry(entry, 2).split("\n");
  const lines = formattedLines.map((line, index) =>
    index === 0 ? `  GUIDE_MANIFEST_ENTRY_SCHEMA.parse(${line}` : `  ${line}`,
  );
  const lastIndex = lines.length - 1;
  lines[lastIndex] = `${lines[lastIndex]}),`;
  return lines.join("\n");
}

export async function appendGuideManifestEntry(entryInput: GuideManifestEntryInput, dryRun: boolean): Promise<void> {
  const normalized = createGuideManifestEntry(entryInput);
  if (guideManifest[normalized.key]) {
    console.log(`ℹ️ Guide manifest already contains ${normalized.key}; skipping entry creation.`);
    return;
  }

  const manifestPath = path.join(ROOT, "src", "routes", "guides", "guide-manifest.ts");
  const manifestSrc = await fs.readFile(manifestPath, "utf8");
  const insertIndex = manifestSrc.indexOf("];");
  if (insertIndex === -1) {
    throw new Error("Could not locate manifest seed terminator (]); in guide-manifest.ts)");
  }
  const before = manifestSrc.slice(0, insertIndex).replace(/\s*$/, "");
  const after = manifestSrc.slice(insertIndex);
  const entrySource = buildManifestEntrySource(entryInput);
  const nextSrc = `${before}\n\n${entrySource}\n${after}`;
  if (dryRun) {
    console.log(`Would add ${normalized.key} to src/routes/guides/guide-manifest.ts`);
    return;
  }
  await fs.writeFile(manifestPath, nextSrc, "utf8");
  console.log(`✅ Added ${normalized.key} to src/routes/guides/guide-manifest.ts`);
}

export async function updateGuideStatusInIndex(
  key: string,
  status: GuideWorkflowStatus,
  dryRun: boolean,
): Promise<void> {
  const indexFile = path.join(ROOT, "src", "data", "guides.index.ts");
  const src = await fs.readFile(indexFile, "utf8");
  const start = src.indexOf("const GUIDES_INDEX_BASE");
  if (start === -1) {
    throw new Error("Could not locate GUIDES_INDEX_BASE in guides.index.ts");
  }
  const arrStart = src.indexOf("[", start);
  const arrEnd = src.indexOf("];", arrStart);
  if (arrStart === -1 || arrEnd === -1) {
    throw new Error("Could not locate GUIDES_INDEX_BASE array bounds");
  }
  const before = src.slice(0, arrStart);
  const arraySrc = src.slice(arrStart, arrEnd + 2);
  const after = src.slice(arrEnd + 2);

  const keyPattern = new RegExp(`({[\\n\\r\\t \\f\\v]*?[^]*?key:\\s*"${escapeRegExp(key)}"[^]*?)(})`, "m");
  const match = arraySrc.match(keyPattern);
  if (!match) {
    console.warn(`⚠️  Guide key ${key} not found in GUIDES_INDEX_BASE; skipping status update`);
    return;
  }
  const block = match[1];
  const tailBrace = match[2];
  let updatedBlock: string;
  if (/status\s*:/m.test(block)) {
    updatedBlock = block.replace(/status\s*:\s*['"][^'"]+['"]/m, `status: "${status}"`);
  } else {
    const indentMatch = block.match(/\n([\t ]*)[^\n]*$/);
    const indent = indentMatch ? indentMatch[1] ?? "  " : "  ";
    updatedBlock = block.replace(/\s*$/m, `,\n${indent}status: "${status}"\n`);
  }
  const replacedArray = arraySrc.replace(keyPattern, `${updatedBlock}${tailBrace}`);
  const nextSrc = `${before}${replacedArray}${after}`;
  if (dryRun) {
    console.log(`Would update status for ${key} in ${path.relative(ROOT, indexFile)} to ${status}`);
    return;
  }
  await fs.writeFile(indexFile, nextSrc, "utf8");
  console.log(`✅ Updated status for ${key} in ${path.relative(ROOT, indexFile)} to ${status}`);
}