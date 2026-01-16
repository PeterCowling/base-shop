import fs from "node:fs/promises";
import path from "node:path";
import type { Argv, ArgumentsCamelCase } from "yargs";

import { howToGetHereRouteDefinitionsSchema } from "../../../src/lib/how-to-get-here/schema";

import { GuideWorkflowStatus, ROOT, readJson, writeJson } from "../lib/utils";

type HowtoArgs = {
  slug: string;
  key: string;
  status?: GuideWorkflowStatus;
  dryRun: boolean;
  from?: string;
  remap?: string[];
};

export function registerHowtoCommand<T>(yargs: Argv<T>): Argv<T> {
  return yargs.command(
    "howto",
    "Scaffold a how-to-get-here entry and EN content seed",
    (cmd) =>
      cmd
        .option("slug", { type: "string", demandOption: true, describe: "Route slug" })
        .option("key", { type: "string", demandOption: true, describe: "Content key" })
        .option("status", {
          choices: ["draft", "review", "published"] as const,
          describe: "Workflow status for the new entry",
        })
        .option("dry-run", { type: "boolean", default: false })
        .option("from", {
          type: "string",
          describe: "Clone content from an existing EN JSON seed",
        })
        .option("remap", {
          type: "string",
          array: true,
          describe: "When cloning, reset these sections (sections,faqs,images)",
          coerce: (value?: string[]) => normalizeListOption(value),
        }),
    async (argv) => {
      await scaffoldHowto(argv as ArgumentsCamelCase<HowtoArgs>);
    },
  );
}

function normalizeListOption(input?: string[]): string[] | undefined {
  if (!input) return undefined;
  const values = input
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

async function scaffoldHowto(argv: ArgumentsCamelCase<HowtoArgs>): Promise<void> {
  const { slug, key, status, dryRun, from, remap } = argv;
  const dataFile = path.join(ROOT, "src", "data", "how-to-get-here", "routes.json");

  const raw = await readJson<Record<string, unknown>>(dataFile);
  const parsed = howToGetHereRouteDefinitionsSchema.parse(raw);
  const routes = parsed.routes as Record<string, any>;

  if (routes[slug]) {
    throw new Error(`Route slug already exists: ${slug}`);
  }
  if (Object.values(routes).some((route: any) => route?.contentKey === key)) {
    throw new Error(`Content key already exists: ${key}`);
  }

  const entry: Record<string, unknown> = { contentKey: key };
  if (status) entry.status = status;
  const next = { ...parsed, routes: { ...routes, [slug]: entry } };

  const enOut = path.join(ROOT, "src", "locales", "en", "how-to-get-here", "routes", `${key}.json`);
  let enSeed: Record<string, unknown> = { meta: { title: "TODO-TRANSLATE", description: "TODO-TRANSLATE" } };
  if (from) {
    const fromFile = path.join(ROOT, "src", "locales", "en", "how-to-get-here", "routes", `${from}.json`);
    try {
      const cloned = await readJson<Record<string, unknown>>(fromFile);
      enSeed = JSON.parse(JSON.stringify(cloned));
      if (Array.isArray(remap) && remap.length > 0) {
        if (remap.includes("sections")) (enSeed as Record<string, unknown>).sections = {};
        if (remap.includes("faqs")) (enSeed as Record<string, unknown>).faqs = [];
        if (remap.includes("images")) {
          delete (enSeed as Record<string, unknown>).galleries;
          delete (enSeed as Record<string, unknown>).media;
        }
      }
    } catch {
      console.warn(`⚠️  --from=${from} not found; using default seed`);
    }
  }

  if (dryRun) {
    console.log("Would write:");
    console.log(` - ${path.relative(ROOT, dataFile)} (add slug ${slug})`);
    console.log(` - ${path.relative(ROOT, enOut)} (seed EN content)`);
    return;
  }

  const originalRoutes = JSON.stringify(parsed, null, 2);
  let wroteContent = false;
  try {
    await writeJson(enOut, enSeed);
    wroteContent = true;
    await writeJson(dataFile, next);
    console.log("✅ Scaffolded how-to:", slug, "→", key);
  } catch (err) {
    if (wroteContent) {
      try {
        await fs.rm(enOut, { force: true });
      } catch {
        // ignore
      }
    }
    try {
      await fs.writeFile(dataFile, originalRoutes + "\n", "utf8");
    } catch {
      // ignore
    }
    throw err;
  }
}