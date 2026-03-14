import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type Source = {
  file: string;
  label: string;
  port: number;
};

type Assignment = {
  app: string;
  packageName: string | null;
  port: number;
  sources: Source[];
};

type CliOptions = {
  checkDoc: boolean;
  writeDoc: boolean;
  json: boolean;
};

const SCRIPT_PORT_PATTERN = /(?:^|\s)(?:-p|--port)\s*(\d{2,5})(?=\s|$)/g;
const NEXT_COMMAND_PATTERN = /\bnext\s+(?:dev|start)\b/;
const SERVER_PORT_PATTERN =
  /process\.env(?:\.PORT|\["PORT"\])\s*\?\?\s*(\d{2,5})/g;
const SCRIPT_NAMES = ["dev", "start"] as const;
const DOC_PATH = "docs/dev-ports.md";

function parseArgs(argv: readonly string[]): CliOptions {
  return {
    checkDoc: argv.includes("--check-doc"),
    writeDoc: argv.includes("--write-doc"),
    json: argv.includes("--json"),
  };
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function extractPorts(text: string, pattern: RegExp): number[] {
  return [...text.matchAll(pattern)]
    .map((match) => Number.parseInt(match[1] ?? "", 10))
    .filter((value) => Number.isFinite(value));
}

function uniqueNumbers(values: readonly number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function toRepoRelative(repoRoot: string, filePath: string): string {
  return normalizePath(path.relative(repoRoot, filePath));
}

function collectPackageScriptSources(
  repoRoot: string,
  appDir: string,
  scripts: Record<string, string> | undefined,
  errors: string[],
): Source[] {
  if (!scripts) return [];

  const packagePath = toRepoRelative(repoRoot, path.join(appDir, "package.json"));
  const sources: Source[] = [];

  for (const scriptName of SCRIPT_NAMES) {
    const command = scripts[scriptName];
    if (!command) continue;

    if (NEXT_COMMAND_PATTERN.test(command) && !SCRIPT_PORT_PATTERN.test(command)) {
      errors.push(
        `${packagePath} script "${scriptName}" runs Next.js without an explicit -p/--port flag.`,
      );
      SCRIPT_PORT_PATTERN.lastIndex = 0;
      continue;
    }

    SCRIPT_PORT_PATTERN.lastIndex = 0;
    for (const port of extractPorts(command, SCRIPT_PORT_PATTERN)) {
      sources.push({
        file: packagePath,
        label: `package.json script "${scriptName}"`,
        port,
      });
    }
  }

  return sources;
}

function collectServerSources(repoRoot: string, appDir: string): Source[] {
  const candidateFiles = ["src/server.ts", "server.ts"];
  const sources: Source[] = [];

  for (const relativePath of candidateFiles) {
    const filePath = path.join(appDir, relativePath);
    if (!fs.existsSync(filePath)) continue;

    const contents = fs.readFileSync(filePath, "utf8");
    for (const port of extractPorts(contents, SERVER_PORT_PATTERN)) {
      sources.push({
        file: toRepoRelative(repoRoot, filePath),
        label: normalizePath(relativePath),
        port,
      });
    }
  }

  return sources;
}

function scanAssignments(repoRoot: string): { assignments: Assignment[]; errors: string[] } {
  const appsRoot = path.join(repoRoot, "apps");
  const errors: string[] = [];
  const assignments: Assignment[] = [];

  for (const entry of fs.readdirSync(appsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const appDir = path.join(appsRoot, entry.name);
    const packagePath = path.join(appDir, "package.json");
    if (!fs.existsSync(packagePath)) continue;

    const pkg = readJsonFile<{ name?: string; scripts?: Record<string, string> }>(packagePath);
    const packageSources = collectPackageScriptSources(repoRoot, appDir, pkg.scripts, errors);
    const serverSources = collectServerSources(repoRoot, appDir);
    const sources = [...packageSources, ...serverSources];
    if (sources.length === 0) continue;

    const ports = uniqueNumbers(sources.map((source) => source.port));
    if (ports.length !== 1) {
      const details = sources
        .map((source) => `${source.label}=${source.port} (${source.file})`)
        .join(", ");
      errors.push(`apps/${entry.name} defines inconsistent localhost ports: ${details}`);
      continue;
    }

    assignments.push({
      app: entry.name,
      packageName: pkg.name ?? null,
      port: ports[0],
      sources,
    });
  }

  const assignmentsByPort = new Map<number, Assignment[]>();
  for (const assignment of assignments) {
    const existing = assignmentsByPort.get(assignment.port) ?? [];
    existing.push(assignment);
    assignmentsByPort.set(assignment.port, existing);
  }

  for (const [port, owners] of assignmentsByPort) {
    if (owners.length < 2) continue;
    const ownerSummary = owners
      .sort((left, right) => left.app.localeCompare(right.app))
      .map((owner) => `apps/${owner.app}`)
      .join(", ");
    errors.push(`Port ${port} is assigned to multiple apps: ${ownerSummary}`);
  }

  assignments.sort((left, right) => left.port - right.port || left.app.localeCompare(right.app));
  return { assignments, errors };
}

function renderDoc(assignments: readonly Assignment[]): string {
  const lines = [
    "---",
    "Type: Reference",
    "Status: Active",
    "Domain: Repo",
    "Last-reviewed: 2026-03-11",
    "---",
    "",
    "# Dev Ports",
    "",
    "Canonical localhost port assignments for repo apps. Keep ports unique. Regenerate/check via `pnpm --filter scripts validate-dev-ports -- --write-doc`.",
    "",
    "| App | Package | Port | Sources |",
    "| --- | --- | ---: | --- |",
  ];

  for (const assignment of assignments) {
    const sourceSummary = assignment.sources
      .map((source) => `${source.label} (${source.file})`)
      .join("<br>");
    lines.push(
      `| \`apps/${assignment.app}\` | \`${assignment.packageName ?? "(none)"}\` | \`${assignment.port}\` | ${sourceSummary} |`,
    );
  }

  lines.push("");
  return `${lines.join("\n")}`;
}

function maybeWriteDoc(repoRoot: string, contents: string): void {
  const docPath = path.join(repoRoot, DOC_PATH);
  fs.writeFileSync(docPath, contents);
}

function checkDoc(repoRoot: string, expected: string, errors: string[]): void {
  const docPath = path.join(repoRoot, DOC_PATH);
  if (!fs.existsSync(docPath)) {
    errors.push(
      `${DOC_PATH} is missing. Run: pnpm --filter scripts validate-dev-ports -- --write-doc`,
    );
    return;
  }

  const actual = fs.readFileSync(docPath, "utf8");
  if (actual !== expected) {
    errors.push(
      `${DOC_PATH} is stale. Run: pnpm --filter scripts validate-dev-ports -- --write-doc`,
    );
  }
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(__dirname, "../../..");
  const { assignments, errors } = scanAssignments(repoRoot);
  const docContents = renderDoc(assignments);

  if (options.writeDoc) {
    maybeWriteDoc(repoRoot, docContents);
  }

  if (options.checkDoc || (!options.writeDoc && !options.json)) {
    checkDoc(repoRoot, docContents, errors);
  }

  if (options.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          assignments: assignments.map((assignment) => ({
            ...assignment,
            sources: assignment.sources,
          })),
          errors,
        },
        null,
        2,
      )}\n`,
    );
  } else if (errors.length === 0) {
    process.stdout.write(
      `OK: ${assignments.length} app port assignments validated with no collisions.\n`,
    );
  } else {
    process.stdout.write("FAIL: localhost port validation failed.\n");
    for (const error of errors) {
      process.stdout.write(`- ${error}\n`);
    }
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main();
