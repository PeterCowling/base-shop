import { spawnSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const DEFAULT_SOURCE_ROOTS = [
  "docs/plans",
  "docs/business-os/startup-loop",
  ".claude/skills",
];

type Mode = "fact-find" | "plan";

interface CassRetrieveOptions {
  mode: Mode;
  slug: string | null;
  topic: string | null;
  queryOverride: string | null;
  topK: number;
  outPath: string | null;
  sourceRoots: string[];
  strict: boolean;
}

interface RetrievedHit {
  path: string;
  line: number;
  snippet: string;
}

interface RetrievalResult {
  provider: "cass" | "fallback-rg" | "none";
  query: string;
  output: string;
  hits: RetrievedHit[];
  warnings: string[];
}

function usage(): string {
  return [
    "Usage:",
    "  pnpm startup-loop:cass-retrieve -- --mode <fact-find|plan> [options]",
    "",
    "Options:",
    "  --mode <fact-find|plan>       Required",
    "  --slug <feature-slug>         Optional plan/fact-find slug",
    "  --topic <text>                Optional topic phrase",
    "  --query <text>                Optional direct query override",
    "  --k <number>                  Result count target (default: 8)",
    "  --out <path>                  Output markdown path override",
    "  --source-roots <csv>          CSV list of source roots",
    "  --strict                      Exit non-zero if CASS path is unavailable",
    "  --help                        Show this help",
    "",
    "Environment:",
    "  CASS_RETRIEVE_COMMAND         Optional shell command used for CASS retrieval",
    "                                Receives env: CASS_QUERY, CASS_TOP_K, CASS_SOURCE_ROOTS",
  ].join("\n");
}

function parseArgs(argv: string[]): CassRetrieveOptions {
  let mode: Mode | null = null;
  let slug: string | null = null;
  let topic: string | null = null;
  let queryOverride: string | null = null;
  let topK = 8;
  let outPath: string | null = null;
  let sourceRoots = [...DEFAULT_SOURCE_ROOTS];
  let strict = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--mode") {
      const value = argv[i + 1];
      if (value !== "fact-find" && value !== "plan") {
        throw new Error("--mode must be fact-find or plan");
      }
      mode = value;
      i += 1;
      continue;
    }

    if (arg === "--slug") {
      slug = (argv[i + 1] ?? "").trim() || null;
      i += 1;
      continue;
    }

    if (arg === "--topic") {
      topic = (argv[i + 1] ?? "").trim() || null;
      i += 1;
      continue;
    }

    if (arg === "--query") {
      queryOverride = (argv[i + 1] ?? "").trim() || null;
      i += 1;
      continue;
    }

    if (arg === "--k") {
      const raw = argv[i + 1];
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 1) {
        throw new Error("--k must be a positive number");
      }
      topK = Math.floor(parsed);
      i += 1;
      continue;
    }

    if (arg === "--out") {
      outPath = (argv[i + 1] ?? "").trim() || null;
      i += 1;
      continue;
    }

    if (arg === "--source-roots") {
      const raw = argv[i + 1] ?? "";
      sourceRoots = raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (arg === "--strict") {
      strict = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!mode) {
    throw new Error("--mode is required");
  }

  if (sourceRoots.length === 0) {
    sourceRoots = [...DEFAULT_SOURCE_ROOTS];
  }

  return {
    mode,
    slug,
    topic,
    queryOverride,
    topK,
    outPath,
    sourceRoots,
    strict,
  };
}

function toPosix(p: string): string {
  return p.replaceAll("\\", "/");
}

function shellEscapeSingleQuotes(value: string): string {
  return `'${value.replaceAll("'", `'\"'\"'`)}'`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function makeDefaultQuery(options: CassRetrieveOptions): string {
  if (options.queryOverride) return options.queryOverride;

  const chunks: string[] = [`startup loop ${options.mode}`];
  if (options.slug) chunks.push(`feature slug ${options.slug}`);
  if (options.topic) chunks.push(`topic ${options.topic}`);
  chunks.push("prior evidence, reusable decisions, blockers, mitigations");
  return chunks.join("; ");
}

function defaultOutputPath(repoRoot: string, options: CassRetrieveOptions): string {
  if (options.outPath) {
    return path.resolve(repoRoot, options.outPath);
  }

  if (options.slug) {
    return path.resolve(repoRoot, "docs", "plans", options.slug, "artifacts", "cass-context.md");
  }

  const stamp = new Date().toISOString().replaceAll(":", "-");
  return path.resolve(repoRoot, "docs", "plans", "_tmp", `cass-context-${options.mode}-${stamp}.md`);
}

function collectTerms(query: string): string[] {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "mode",
    "topic",
    "prior",
    "feature",
    "slug",
    "startup",
    "loop",
    "plan",
    "find",
    "fact",
  ]);

  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !stopWords.has(term));
}

function runCassCommand(query: string, options: CassRetrieveOptions): { ok: boolean; output: string; warning?: string } {
  const command = process.env.CASS_RETRIEVE_COMMAND?.trim();
  if (!command) {
    return {
      ok: false,
      output: "",
      warning:
        "CASS_RETRIEVE_COMMAND is not configured; using local rg fallback retrieval. Set CASS_RETRIEVE_COMMAND to enable CASS.",
    };
  }

  const env = {
    ...process.env,
    CASS_QUERY: query,
    CASS_TOP_K: String(options.topK),
    CASS_SOURCE_ROOTS: options.sourceRoots.join(","),
  };

  const result = spawnSync("bash", ["-lc", command], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const stderr = normalizeWhitespace(result.stderr || "");
    return {
      ok: false,
      output: "",
      warning: `CASS command failed (exit ${result.status ?? "unknown"}): ${stderr || "no stderr"}`,
    };
  }

  return { ok: true, output: (result.stdout || "").trim() };
}

function runFallbackRg(query: string, options: CassRetrieveOptions): { hits: RetrievedHit[]; warning?: string } {
  const terms = collectTerms(query);
  if (terms.length === 0) {
    return { hits: [], warning: "No usable query terms for rg fallback retrieval." };
  }

  const pattern = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const roots = options.sourceRoots.map((root) => shellEscapeSingleQuotes(root)).join(" ");
  const cmd = [
    "rg",
    "--line-number",
    "--no-heading",
    "--color",
    "never",
    "--max-count",
    String(options.topK),
    shellEscapeSingleQuotes(pattern),
    roots,
  ].join(" ");

  const result = spawnSync("bash", ["-lc", cmd], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
  });

  if (result.status !== 0 && (result.stderr || "").trim()) {
    return {
      hits: [],
      warning: `rg fallback failed: ${normalizeWhitespace(result.stderr)}`,
    };
  }

  const lines = (result.stdout || "").split(/\r?\n/).filter(Boolean);
  const hits: RetrievedHit[] = [];

  for (const line of lines.slice(0, options.topK)) {
    const match = line.match(/^(.*?):(\d+):(.*)$/);
    if (!match) continue;

    hits.push({
      path: toPosix(match[1]),
      line: Number(match[2]),
      snippet: match[3].trim(),
    });
  }

  return { hits };
}

async function renderAndPersist(
  targetPath: string,
  options: CassRetrieveOptions,
  result: RetrievalResult,
): Promise<void> {
  const generated = new Date().toISOString();
  const lines: string[] = [];

  lines.push("---");
  lines.push("Type: Startup-Loop-CASS-Context");
  lines.push("Status: Active");
  lines.push(`Mode: ${options.mode}`);
  lines.push(`Generated: ${generated}`);
  lines.push(`Provider: ${result.provider}`);
  if (options.slug) lines.push(`Slug: ${options.slug}`);
  lines.push("---");
  lines.push("");

  lines.push("# CASS Context Pack");
  lines.push("");
  lines.push(`- Query: ${result.query}`);
  lines.push(`- Top-K target: ${options.topK}`);
  lines.push(`- Source roots: ${options.sourceRoots.join(", ")}`);
  lines.push(`- Provider used: ${result.provider}`);
  lines.push("");

  if (result.warnings.length > 0) {
    lines.push("## Retrieval Warnings");
    lines.push("");
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  if (result.provider === "cass") {
    lines.push("## CASS Output");
    lines.push("");
    if (result.output) {
      lines.push(result.output);
    } else {
      lines.push("No output returned by CASS command.");
    }
    lines.push("");
  }

  if (result.hits.length > 0) {
    lines.push("## Local Fallback Matches");
    lines.push("");
    lines.push("| File | Line | Snippet |");
    lines.push("|---|---:|---|");
    for (const hit of result.hits) {
      const safeSnippet = hit.snippet.replaceAll("|", "\\|");
      lines.push(`| ${hit.path} | ${hit.line} | ${safeSnippet} |`);
    }
    lines.push("");
  }

  lines.push("## How To Use");
  lines.push("");
  lines.push("- Treat this as advisory context only.");
  lines.push("- Keep canonical evidence links in fact-find/plan artifacts.");
  lines.push("- If retrieval quality is low, refine the query and re-run.");
  lines.push("");

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${lines.join("\n")}\n`, "utf8");
}

export async function runCassRetrieve(options: CassRetrieveOptions): Promise<{ outputPath: string; result: RetrievalResult }> {
  const query = makeDefaultQuery(options);
  const warnings: string[] = [];
  const cass = runCassCommand(query, options);

  let provider: RetrievalResult["provider"] = "none";
  let output = "";
  let hits: RetrievedHit[] = [];

  if (cass.warning) warnings.push(cass.warning);

  if (cass.ok) {
    provider = "cass";
    output = cass.output;
  } else {
    const fallback = runFallbackRg(query, options);
    hits = fallback.hits;
    if (fallback.warning) warnings.push(fallback.warning);
    provider = hits.length > 0 ? "fallback-rg" : "none";
  }

  if (options.strict && provider !== "cass") {
    throw new Error(
      `strict mode enabled: CASS unavailable (provider=${provider}). Configure CASS_RETRIEVE_COMMAND to enable CASS retrieval.`,
    );
  }

  const outputPath = defaultOutputPath(process.cwd(), options);
  const result: RetrievalResult = {
    provider,
    query,
    output,
    hits,
    warnings,
  };

  await renderAndPersist(outputPath, options, result);
  return { outputPath, result };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { outputPath, result } = await runCassRetrieve(options);

  console.log(
    `[cass-retrieve] wrote ${toPosix(path.relative(process.cwd(), outputPath))} (provider=${result.provider}, hits=${result.hits.length})`,
  );

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(`[cass-retrieve] warning: ${warning}`);
    }
  }
}

if (process.argv[1]?.includes("cass-retrieve")) {
  main().catch((error) => {
    console.error(`[cass-retrieve] fatal: ${String(error)}`);
    process.exit(1);
  });
}
