import fs from "node:fs/promises";
import path from "node:path";
import type { Argv, ArgumentsCamelCase } from "yargs";

import { ROOT, kebab } from "../lib/utils";

type AssistanceArgs = {
  key: string;
  dryRun: boolean;
};

export function registerAssistanceCommand<T>(yargs: Argv<T>): Argv<T> {
  return yargs.command(
    "assistance:article",
    "Create a new assistance article route stub",
    (cmd) =>
      cmd
        .option("key", { type: "string", demandOption: true })
        .option("dry-run", { type: "boolean", default: false }),
    async (argv) => {
      await scaffoldAssistanceArticle(argv as ArgumentsCamelCase<AssistanceArgs>);
    },
  );
}

async function scaffoldAssistanceArticle({ key, dryRun }: ArgumentsCamelCase<AssistanceArgs>): Promise<void> {
  const outDir = path.join(ROOT, "src", "routes", "assistance");
  const kebabName = kebab(key);
  const file = path.join(outDir, `${kebabName}.tsx`);
  const rel = path.relative(ROOT, file);
  try {
    await fs.access(file);
    throw new Error(`Route already exists: ${rel}`);
  } catch {
    // ok
  }
  const src =
    `// ${["src", "routes", "assistance", `${kebabName}.tsx`].join("/")}\n` +
    `import { makeArticleClientLoader, makeArticlePage } from "./_ArticleFactory";\n\n` +
    `export const clientLoader = makeArticleClientLoader(${JSON.stringify(key)});\n` +
    `export { clientLoader as loader };\n\n` +
    `export default makeArticlePage(${JSON.stringify(key)});\n`;

  if (dryRun) {
    console.log(`Would write ${rel}`);
    return;
  }
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(file, src, "utf8");
  console.log("✅ Scaffolded assistance article route:", rel);
}