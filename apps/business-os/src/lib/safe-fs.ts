import type { Dirent, ObjectEncodingOptions } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export function ensurePathWithinRoot(root: string, targetPath: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);

  if (
    resolvedTarget !== resolvedRoot &&
    !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(
      // i18n-exempt -- BOS-105 internal safety error [ttl=2026-03-31]
      `Path escapes root: ${targetPath}`
    );
  }

  return resolvedTarget;
}

export async function accessWithinRoot(
  root: string,
  targetPath: string,
  mode?: Parameters<typeof fs.access>[1]
): Promise<void> {
  const safePath = ensurePathWithinRoot(root, targetPath);
  return fs.access(safePath, mode);
}

export async function readFileWithinRoot(
  root: string,
  targetPath: string,
  options?: Parameters<typeof fs.readFile>[1]
): Promise<string | Buffer> {
  const safePath = ensurePathWithinRoot(root, targetPath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-107 validated path [ttl=2026-03-31]
  return fs.readFile(safePath, options);
}

export async function writeFileWithinRoot(
  root: string,
  targetPath: string,
  data: Parameters<typeof fs.writeFile>[1],
  options?: Parameters<typeof fs.writeFile>[2]
): Promise<void> {
  const safePath = ensurePathWithinRoot(root, targetPath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-107 validated path [ttl=2026-03-31]
  return fs.writeFile(safePath, data, options);
}

export async function mkdirWithinRoot(
  root: string,
  targetPath: string,
  options?: Parameters<typeof fs.mkdir>[1]
): Promise<void> {
  const safePath = ensurePathWithinRoot(root, targetPath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-107 validated path [ttl=2026-03-31]
  await fs.mkdir(safePath, options);
}

type ReaddirOptions =
  | (ObjectEncodingOptions & {
      withFileTypes?: false | undefined;
      recursive?: boolean | undefined;
    })
  | (ObjectEncodingOptions & {
      withFileTypes: true;
      recursive?: boolean | undefined;
    })
  | {
      encoding: "buffer";
      withFileTypes?: false | undefined;
      recursive?: boolean | undefined;
    }
  | {
      encoding: "buffer";
      withFileTypes: true;
      recursive?: boolean | undefined;
    }
  | BufferEncoding
  | "buffer"
  | null
  | undefined;

export function readdirWithinRoot(
  root: string,
  targetPath: string
): Promise<string[]>;
export function readdirWithinRoot(
  root: string,
  targetPath: string,
  options:
    | (ObjectEncodingOptions & {
        withFileTypes?: false | undefined;
        recursive?: boolean | undefined;
      })
    | BufferEncoding
    | null
): Promise<string[]>;
export function readdirWithinRoot(
  root: string,
  targetPath: string,
  options:
    | {
        encoding: "buffer";
        withFileTypes?: false | undefined;
        recursive?: boolean | undefined;
      }
    | "buffer"
): Promise<Buffer[]>;
export function readdirWithinRoot(
  root: string,
  targetPath: string,
  options: ObjectEncodingOptions & {
    withFileTypes: true;
    recursive?: boolean | undefined;
  }
): Promise<Dirent[]>;
export function readdirWithinRoot(
  root: string,
  targetPath: string,
  options: {
    encoding: "buffer";
    withFileTypes: true;
    recursive?: boolean | undefined;
  }
): Promise<Dirent<Buffer>[]>;
export async function readdirWithinRoot(
  root: string,
  targetPath: string,
  options?: ReaddirOptions
): Promise<string[] | Buffer[] | Dirent[] | Dirent<Buffer>[]> {
  const safePath = ensurePathWithinRoot(root, targetPath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-107 validated path [ttl=2026-03-31]
  return fs.readdir(safePath, options as Parameters<typeof fs.readdir>[1]);
}

export async function unlinkWithinRoot(
  root: string,
  targetPath: string
): Promise<void> {
  const safePath = ensurePathWithinRoot(root, targetPath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-107 validated path [ttl=2026-03-31]
  return fs.unlink(safePath);
}
