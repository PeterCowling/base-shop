import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

import { minimatch } from "minimatch";

const DEFAULT_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const DEFAULT_MAX_FILES_SCANNED = 10_000;
const DEFAULT_MAX_MATCHES = 500;

type FileListState = {
  scanned: number;
  matched: number;
  maxFilesScanned: number;
  maxMatches: number;
};

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

function isWithinRoot(candidatePath: string, rootPath: string): boolean {
  const candidate = path.normalize(candidatePath);
  const root = path.normalize(rootPath);
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function normalizeAllowedRoots(baseDir: string, allowedRoots?: string[]): Promise<string[]> {
  const roots = (allowedRoots && allowedRoots.length > 0 ? allowedRoots : [baseDir]).map((root) =>
    path.resolve(baseDir, root),
  );
  const resolvedRoots = await Promise.all(
    roots.map(async (root) => await realpath(root).catch(() => path.resolve(root))),
  );
  return Array.from(new Set(resolvedRoots.map((root) => path.normalize(root))));
}

async function assertWithinAllowedRoots(
  targetPath: string,
  allowedRoots: string[],
  sourceSpec: string,
): Promise<void> {
  const resolvedTarget = await realpath(targetPath).catch(() => path.resolve(targetPath));
  const allowed = allowedRoots.some((root) => isWithinRoot(resolvedTarget, root));
  if (allowed) return;
  throw new Error(`Path is outside allowed roots: ${sourceSpec}`);
}

function trackScanned(state: FileListState): void {
  state.scanned += 1;
  if (state.scanned > state.maxFilesScanned) {
    throw new Error(`File scan limit exceeded (${state.maxFilesScanned}).`);
  }
}

function trackMatched(state: FileListState): void {
  state.matched += 1;
  if (state.matched > state.maxMatches) {
    throw new Error(`Image match limit exceeded (${state.maxMatches}).`);
  }
}

async function listFiles(rootDir: string, recursive: boolean, state: FileListState): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    trackScanned(state);

    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        out.push(...(await listFiles(fullPath, true, state)));
      }
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isImageFile(fullPath)) continue;

    trackMatched(state);
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
  options?: {
    recursiveDirs?: boolean;
    allowedRoots?: string[];
    maxFilesScanned?: number;
    maxMatches?: number;
  },
): Promise<string[]> {
  const recursiveDirs = options?.recursiveDirs ?? false;
  const maxFilesScanned = Math.max(1, options?.maxFilesScanned ?? DEFAULT_MAX_FILES_SCANNED);
  const maxMatches = Math.max(1, options?.maxMatches ?? DEFAULT_MAX_MATCHES);
  const allowedRoots = await normalizeAllowedRoots(baseDir, options?.allowedRoots);
  const state: FileListState = {
    scanned: 0,
    matched: 0,
    maxFilesScanned,
    maxMatches,
  };

  const absolute = path.isAbsolute(fileSpec) ? fileSpec : path.resolve(baseDir, fileSpec);

  if (!hasGlobChars(fileSpec)) {
    await assertWithinAllowedRoots(absolute, allowedRoots, fileSpec);
    const info = await stat(absolute).catch(() => null);
    if (!info) {
      throw new Error(`File not found: ${fileSpec}`);
    }

    if (info.isFile()) {
      if (!isImageFile(absolute)) {
        throw new Error(`Unsupported image file extension: ${fileSpec}`);
      }
      return [absolute];
    }
    if (!info.isDirectory()) {
      throw new Error(`Not a file or directory: ${fileSpec}`);
    }
    return await listFiles(absolute, recursiveDirs, state);
  }

  const { rootDir, relativePattern } = splitGlobRoot(absolute);
  await assertWithinAllowedRoots(rootDir, allowedRoots, fileSpec);
  const rootInfo = await stat(rootDir).catch(() => null);
  if (!rootInfo?.isDirectory()) {
    throw new Error("Glob root not found.");
  }

  if (!relativePattern) {
    throw new Error(`Invalid glob pattern: ${fileSpec}`);
  }

  const candidates = await listFiles(rootDir, true, state);
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
