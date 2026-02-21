import { promises as fs } from "fs";
import path from "path";

import {
  defaultClaudeSettingsPath,
  defaultGeneratedJsonPath,
  defaultGeneratedShellPath,
  type GitSafetyKernel,
  readKernelFromDocs,
  renderShellInclude,
} from "./git-safety-policy";

type Mode = "write" | "check";

function parseArgs(argv: string[]): { mode: Mode } {
  let mode: Mode = "write";
  for (const arg of argv) {
    if (arg === "--check") mode = "check";
    if (arg === "--write") mode = "write";
  }
  return { mode };
}

function stableJson(obj: unknown): string {
  return `${JSON.stringify(obj, null, 2)}\n`;
}

async function readJson(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function fail(msg: string): never {
  console.error(`[generate-git-safety-policy] ERROR: ${msg}`);
  process.exit(1);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function computeExpectedSettings(settings: unknown, kernel: GitSafetyKernel): unknown {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    throw new TypeError("[generate-git-safety-policy] .claude/settings.json must be a JSON object");
  }
  const s = settings as any;
  const next = { ...s };
  next.permissions = {
    ...(s.permissions || {}),
    deny: kernel.claudePermissions.deny,
    ask: kernel.claudePermissions.ask,
    allow: kernel.claudePermissions.allow,
  };
  return next;
}

async function main() {
  const { mode } = parseArgs(process.argv.slice(2));

  const repoRoot = process.cwd();
  const kernel = await readKernelFromDocs(repoRoot);

  const outJsonPath = defaultGeneratedJsonPath(repoRoot);
  const outShPath = defaultGeneratedShellPath(repoRoot);
  const settingsPath = defaultClaudeSettingsPath(repoRoot);

  const expectedJson = stableJson(kernel);
  const expectedSh = renderShellInclude(kernel);

  const settingsExisting = await readJson(settingsPath);
  const settingsExpected = stableJson(computeExpectedSettings(settingsExisting, kernel));

  if (mode === "check") {
    const checks: Array<{ path: string; expected: string }> = [
      { path: outJsonPath, expected: expectedJson },
      { path: outShPath, expected: expectedSh },
      { path: settingsPath, expected: settingsExpected },
    ];

    for (const c of checks) {
      let existing: string;
      try {
        existing = await fs.readFile(c.path, "utf8");
      } catch (err) {
        fail(`Missing generated output: ${path.relative(repoRoot, c.path)}`);
      }
      if (existing !== c.expected) {
        console.error(
          `[generate-git-safety-policy] Output is out of date: ${path.relative(
            repoRoot,
            c.path,
          )}`,
        );
        console.error(
          "Regenerate with: scripts/agents/generate-git-safety-policy --write",
        );
        process.exit(1);
      }
    }

    return;
  }

  await ensureDir(path.dirname(outJsonPath));
  await fs.writeFile(outJsonPath, expectedJson, "utf8");
  await fs.writeFile(outShPath, expectedSh, "utf8");
  await fs.writeFile(settingsPath, settingsExpected, "utf8");

  console.log(
    `[generate-git-safety-policy] Wrote ${path.relative(repoRoot, outJsonPath)}`,
  );
  console.log(
    `[generate-git-safety-policy] Wrote ${path.relative(repoRoot, outShPath)}`,
  );
  console.log(
    `[generate-git-safety-policy] Updated ${path.relative(repoRoot, settingsPath)} permissions`,
  );
}

main().catch((err) => {
  console.error(String(err));
  process.exit(1);
});

