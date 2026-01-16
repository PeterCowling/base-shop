import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { minimatch } from "minimatch";

const DEFAULT_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function hasGlobChars(input: string): boolean {
  return /[*?[\]{}()!]/.test(input);
}

function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return DEFAULT_IMAGE_EXTENSIONS.has(ext);
}

async function listFiles(rootDir: string, recursive: boolean): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        out.push(...(await listFiles(fullPath, true)));
      }
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isImageFile(fullPath)) continue;
    out.push(fullPath);
  }
  return out;
}

function splitGlobRoot(absolutePattern: string): { rootDir: string; relativePattern: string } {
  const parsed = path.parse(absolutePattern);
  const withoutRoot = absolutePattern.slice(parsed.root.length);
  const segments = withoutRoot.split(path.sep).filter(Boolean);

  const rootSegments: string[] = [];
  const patternSegments: string[] = [];
  let globFound = false;
  for (const segment of segments) {
    if (!globFound && !hasGlobChars(segment)) {
      rootSegments.push(segment);
    } else {
      globFound = true;
      patternSegments.push(segment);
    }
  }

  return {
    rootDir: path.join(parsed.root, ...rootSegments),
    relativePattern: patternSegments.join(path.sep),
  };
}

export async function expandFileSpec(
  fileSpec: string,
  baseDir: string,
  options?: { recursiveDirs?: boolean },
): Promise<string[]> {
  const recursiveDirs = options?.recursiveDirs ?? false;
  const absolute = path.isAbsolute(fileSpec) ? fileSpec : path.resolve(baseDir, fileSpec);

  if (!hasGlobChars(fileSpec)) {
    const info = await stat(absolute).catch(() => null);
    if (!info) {
      throw new Error(`File not found: ${fileSpec}`);
    }
    if (info.isFile()) return [absolute];
    if (!info.isDirectory()) {
      throw new Error(`Not a file or directory: ${fileSpec}`);
    }
    return await listFiles(absolute, recursiveDirs);
  }

  const { rootDir, relativePattern } = splitGlobRoot(absolute);
  const rootInfo = await stat(rootDir).catch(() => null);
  if (!rootInfo?.isDirectory()) {
    throw new Error(`Glob root not found: ${rootDir}`);
  }
  if (!relativePattern) {
    throw new Error(`Invalid glob pattern: ${fileSpec}`);
  }

  const candidates = await listFiles(rootDir, true);
  const normalizedPattern = toPosixPath(relativePattern);
  const matched = candidates.filter((candidate) => {
    const rel = path.relative(rootDir, candidate);
    return minimatch(toPosixPath(rel), normalizedPattern, { dot: false, nocase: true });
  });

  matched.sort((a, b) =>
    toPosixPath(path.relative(rootDir, a)).localeCompare(toPosixPath(path.relative(rootDir, b))),
  );

  if (!matched.length) {
    throw new Error(`Glob matched 0 files: ${fileSpec}`);
  }
  return matched;
}
