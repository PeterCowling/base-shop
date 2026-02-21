import path from "path";

import { defaultRegistryPath, readSkillRegistry } from "./skill-registry";

// Avoid crashing when output is piped to a consumer that closes early (e.g. `head`).
process.stdout.on("error", (err: any) => {
  if (err && err.code === "EPIPE") process.exit(0);
});

function parseArgs(argv: string[]): { json: boolean; grep: string | null } {
  let json = false;
  let grep: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") json = true;
    if (arg === "--grep") {
      const next = argv[i + 1];
      if (!next) throw new Error("--grep requires a pattern");
      grep = next;
      i++;
    }
  }

  return { json, grep };
}

function matches(
  entry: { name: string; description: string; path: string },
  q: string,
): boolean {
  const needle = q.toLowerCase();
  return (
    entry.name.toLowerCase().includes(needle) ||
    entry.description.toLowerCase().includes(needle) ||
    entry.path.toLowerCase().includes(needle)
  );
}

async function main() {
  const { json, grep } = parseArgs(process.argv.slice(2));
  const registryPath = defaultRegistryPath(process.cwd());
  const registry = await readSkillRegistry(registryPath);

  const skills = grep
    ? registry.skills.filter((e) => matches(e, grep))
    : registry.skills;

  if (json) {
    process.stdout.write(`${JSON.stringify(skills, null, 2)}\n`);
    return;
  }

  // Simple fixed-width columns for grep-friendly output.
  const rows = skills.map((s) => ({
    name: s.name,
    path: s.path,
    description: s.description,
  }));

  const nameW = Math.min(
    36,
    Math.max("name".length, ...rows.map((r) => r.name.length)),
  );
  const pathW = Math.min(
    52,
    Math.max("path".length, ...rows.map((r) => r.path.length)),
  );

  console.log(`${"name".padEnd(nameW)}  ${"path".padEnd(pathW)}  description`);
  console.log(`${"-".repeat(nameW)}  ${"-".repeat(pathW)}  -----------`);
  for (const r of rows) {
    const desc = r.description.replace(/\s+/g, " ");
    console.log(`${r.name.padEnd(nameW)}  ${r.path.padEnd(pathW)}  ${desc}`);
  }

  console.log("");
  console.log(
    `[list-skills] ${skills.length}/${registry.skills.length} skills from ${path.relative(
      process.cwd(),
      registryPath,
    )}`,
  );
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});
