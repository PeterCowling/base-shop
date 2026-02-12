import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export async function listJsonFiles(
  rootDir: string,
  relativeDir = "",
): Promise<string[]> {
  const entries = await readdir(path.join(rootDir, relativeDir), {
    withFileTypes: true,
  });
  const files: string[] = [];

  for (const entry of entries) {
    const nextRelative = relativeDir
      ? path.join(relativeDir, entry.name)
      : entry.name;

    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(rootDir, nextRelative)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(nextRelative);
    }
  }

  return files.sort();
}

export async function readJson<T = unknown>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export function extractStringsFromContent(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractStringsFromContent);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(extractStringsFromContent);
  }

  return [];
}
