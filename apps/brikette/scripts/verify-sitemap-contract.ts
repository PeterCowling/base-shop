import { readFile } from "node:fs/promises";
import path from "node:path";

import { listCanonicalSitemapPaths, normalizePathname } from "./generate-public-seo";

const DEFAULT_FILE = "public/sitemap.xml";
const LOC_PATTERN = /<loc>([^<]+)<\/loc>/g;

function parseArgs(argv: string[]): string {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--file") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --file");
      }
      return value;
    }
    if (arg.startsWith("--file=")) {
      return arg.slice("--file=".length);
    }
  }
  return DEFAULT_FILE;
}

async function main(): Promise<void> {
  const relativePath = parseArgs(process.argv.slice(2));
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const xml = await readFile(absolutePath, "utf8");

  const emittedPaths = new Set(
    Array.from(xml.matchAll(LOC_PATTERN)).flatMap((match) => {
      const value = match[1];
      try {
        return [normalizePathname(new URL(value).pathname)];
      } catch {
        return [];
      }
    }),
  );

  const expectedPaths = Array.from(new Set(listCanonicalSitemapPaths().map(normalizePathname)));
  const missingPaths = expectedPaths.filter((candidate) => !emittedPaths.has(candidate));

  if (missingPaths.length > 0) {
    console.error(
      JSON.stringify(
        {
          file: absolutePath,
          expected: expectedPaths.length,
          emitted: emittedPaths.size,
          missing: missingPaths.length,
          sample: missingPaths.slice(0, 50),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.info(
    JSON.stringify(
      {
        file: absolutePath,
        expected: expectedPaths.length,
        emitted: emittedPaths.size,
        missing: 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
