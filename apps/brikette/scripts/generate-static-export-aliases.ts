import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildLocalizedStaticAliasPairs } from "../src/routing/staticExportAliases";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_OUT_DIR = path.join(APP_ROOT, "out");

function trimLeadingSlash(routePath: string): string {
  return routePath.replace(/^\/+/, "");
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }
    throw error;
  }
}

function parseOutDirArg(): string {
  const outDirArgPrefix = "--out-dir=";
  const outDirArg = process.argv.find((arg) => arg.startsWith(outDirArgPrefix));
  if (!outDirArg) return DEFAULT_OUT_DIR;
  return path.resolve(outDirArg.slice(outDirArgPrefix.length));
}

async function main(): Promise<void> {
  const outDir = parseOutDirArg();
  const aliasPairs = buildLocalizedStaticAliasPairs();

  let created = 0;
  let skipped = 0;
  const missingSources: string[] = [];

  for (const pair of aliasPairs) {
    const sourcePath = path.join(outDir, trimLeadingSlash(pair.sourceBasePath));
    const targetPath = path.join(outDir, trimLeadingSlash(pair.targetBasePath));

    if (!(await pathExists(targetPath))) {
      missingSources.push(
        `${pair.targetBasePath} (for ${pair.sourceBasePath})`
      );
      continue;
    }

    if (await pathExists(sourcePath)) {
      skipped += 1;
      continue;
    }

    await mkdir(path.dirname(sourcePath), { recursive: true });
    await cp(targetPath, sourcePath, { recursive: true });
    created += 1;
  }

  if (missingSources.length > 0) {
    const sample = missingSources
      .slice(0, 10)
      .map((value) => `  - ${value}`)
      .join("\n");
    throw new Error(
      [
        `Static export alias generation failed: missing ${missingSources.length} source path(s) in ${outDir}.`,
        sample,
      ].join("\n")
    );
  }

  console.log(
    `Created ${created} localized static alias path(s); skipped ${skipped} existing path(s) in ${outDir}.`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
