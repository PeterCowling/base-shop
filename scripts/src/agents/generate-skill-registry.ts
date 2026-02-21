import path from "path";

import {
  buildSkillRegistry,
  defaultRegistryPath,
  readSkillRegistry,
  writeSkillRegistry,
} from "./skill-registry";

type Mode = "write" | "check";

function parseArgs(argv: string[]): { mode: Mode; outPath: string } {
  let mode: Mode = "write";
  let outPath: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--check") mode = "check";
    if (arg === "--write") mode = "write";
    if (arg === "--out") {
      const next = argv[i + 1];
      if (!next) throw new Error("--out requires a path");
      outPath = next;
      i++;
    }
  }

  return {
    mode,
    outPath: path.resolve(outPath ?? defaultRegistryPath(process.cwd())),
  };
}

async function main() {
  const { mode, outPath } = parseArgs(process.argv.slice(2));

  const expected = await buildSkillRegistry(process.cwd());

  if (mode === "check") {
    try {
      const existing = await readSkillRegistry(outPath);
      const a = JSON.stringify(existing, null, 2);
      const b = JSON.stringify(expected, null, 2);
      if (a !== b) {
        console.error(
          `[generate-skill-registry] Registry is out of date: ${path.relative(
            process.cwd(),
            outPath,
          )}`,
        );
        console.error(
          "Regenerate with: scripts/agents/generate-skill-registry --write",
        );
        process.exit(1);
      }
    } catch (err) {
      console.error(
        `[generate-skill-registry] Failed to read/validate registry at ${outPath}`,
      );
      console.error(String(err));
      console.error(
        "Generate with: scripts/agents/generate-skill-registry --write",
      );
      process.exit(1);
    }

    return;
  }

  await writeSkillRegistry(expected, outPath);
  console.log(
    `[generate-skill-registry] Wrote ${path.relative(process.cwd(), outPath)} (${expected.skills.length} skills)`,
  );
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
