/**
 * dead-code-audit.ts
 *
 * Audits apps for functionality that exists in code but is no longer reachable
 * through the UI — directly or indirectly. Produces a ranked report with
 * confidence levels so the team can decide what to remove vs retain.
 *
 * Usage:
 *   node --import tsx scripts/src/quality/dead-code-audit.ts [options]
 *
 * Options:
 *   --app=reception|brikette|xa-uploader|prime|all   (default: all)
 *   --category=api|pages|exports|flags|all     (default: all)
 *   --format=md|json                           (default: md)
 *   --help
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import * as ts from "typescript";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppId = "reception" | "brikette" | "xa-uploader" | "prime";
export type Category = "api" | "pages" | "exports" | "flags";
export type Confidence = "high" | "medium" | "low";

export interface Finding {
  app: AppId;
  category: Category;
  filePath: string; // relative to repo root
  displayPath: string; // short path for report
  reason: string;
  confidence: Confidence;
  note?: string; // extra context e.g. git last-modified
}

export interface CliOptions {
  apps: AppId[];
  categories: Category[];
  format: "md" | "json";
  repoRoot: string;
}

// ─── App configuration ───────────────────────────────────────────────────────

interface AppConfig {
  srcRoot: string; // relative to repo root
  appDir: string; // Next.js app directory
  apiDir: string; // API routes directory
  productionDirs: string[]; // dirs to scan for export reachability
  moduleGraphRoots?: string[]; // roots to scan for inbound imports into srcRoot
  envFile: string | null; // feature flag source
  envExampleFile: string | null;
  knownLiveUnlinkedRoutes?: string[]; // intentional hidden routes
}

const APP_CONFIGS: Record<AppId, AppConfig> = {
  reception: {
    srcRoot: "apps/reception/src",
    appDir: "apps/reception/src/app",
    apiDir: "apps/reception/src/app/api",
    productionDirs: [
      "apps/reception/src/hooks",
      "apps/reception/src/lib",
      "apps/reception/src/utils",
      "apps/reception/src/services",
    ],
    envFile: null,
    envExampleFile: "apps/reception/.env.example",
  },
  brikette: {
    srcRoot: "apps/brikette/src",
    appDir: "apps/brikette/src/app",
    apiDir: "apps/brikette/src/app/api",
    productionDirs: [
      "apps/brikette/src/hooks",
      "apps/brikette/src/lib",
      "apps/brikette/src/utils",
      "apps/brikette/src/services",
    ],
    envFile: "apps/brikette/src/config/env.ts",
    envExampleFile: "apps/brikette/.env.example",
  },
  "xa-uploader": {
    srcRoot: "apps/xa-uploader/src",
    appDir: "apps/xa-uploader/src/app",
    apiDir: "apps/xa-uploader/src/app/api",
    productionDirs: [
      "apps/xa-uploader/src/lib",
      "apps/xa-uploader/src/utils",
      "apps/xa-uploader/src/hooks",
    ],
    envFile: null,
    envExampleFile: null,
  },
  prime: {
    srcRoot: "apps/prime/src",
    appDir: "apps/prime/src/app",
    apiDir: "apps/prime/src/app/api",
    productionDirs: [
      "apps/prime/src/hooks",
      "apps/prime/src/lib",
      "apps/prime/src/utils",
      "apps/prime/src/services",
    ],
    moduleGraphRoots: [
      "apps/prime/src",
      "apps/prime/functions",
    ],
    envFile: null,
    envExampleFile: null,
    knownLiveUnlinkedRoutes: [
      "/owner/scorecard",
      "/language-selector",
    ],
  },
};

interface ModuleGraph {
  productionInbound: Map<string, Set<string>>;
  testInbound: Map<string, Set<string>>;
}

const MODULE_GRAPH_CACHE = new Map<string, ModuleGraph>();

// ─── CLI parsing ─────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): CliOptions {
  let apps: AppId[] = ["reception", "brikette", "xa-uploader", "prime"];
  let categories: Category[] = ["api", "pages", "exports", "flags"];
  let format: "md" | "json" = "md";

  for (const arg of argv) {
    if (arg.startsWith("--app=")) {
      const v = arg.slice("--app=".length);
      if (v === "all") {
        apps = ["reception", "brikette", "xa-uploader", "prime"];
      } else if (v === "reception" || v === "brikette" || v === "xa-uploader" || v === "prime") {
        apps = [v];
      } else {
        throw new Error(`Unknown app: ${v}`);
      }
    } else if (arg.startsWith("--category=")) {
      const v = arg.slice("--category=".length);
      if (v === "all") {
        categories = ["api", "pages", "exports", "flags"];
      } else {
        const vals = v.split(",").map((s) => s.trim());
        for (const val of vals) {
          if (val !== "api" && val !== "pages" && val !== "exports" && val !== "flags") {
            throw new Error(`Unknown category: ${val}`);
          }
        }
        categories = vals as Category[];
      }
    } else if (arg.startsWith("--format=")) {
      const v = arg.slice("--format=".length);
      if (v === "md" || v === "json") {
        format = v;
      } else {
        throw new Error(`Unknown format: ${v}`);
      }
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return {
    apps,
    categories,
    format,
    repoRoot: resolve(process.cwd()),
  };
}

function printHelp(): void {
  process.stdout.write(
    [
      "Usage: node --import tsx scripts/src/quality/dead-code-audit.ts [options]",
      "",
      "Options:",
      "  --app=reception|brikette|xa-uploader|prime|all  (default: all)",
      "  --category=api|pages|exports|flags|all    (default: all)",
      "  --format=md|json                          (default: md)",
      "  --help",
      "",
    ].join("\n"),
  );
}

// ─── File utilities ───────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "coverage", ".turbo"]);
const SOURCE_EXTS = new Set([".ts", ".tsx"]);
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function walkFiles(dir: string, allowedExts: ReadonlySet<string> = SOURCE_EXTS): string[] {
  const abs = resolve(dir);
  if (!existsSync(abs)) return [];
  const results: string[] = [];
  const queue: string[] = [abs];
  while (queue.length > 0) {
    const cur = queue.pop()!;
    const parts = cur.split(/[/\\]/);
    if (parts.some((p) => SKIP_DIRS.has(p))) continue;
    const stat = statSync(cur);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(cur, { withFileTypes: true })) {
        queue.push(join(cur, entry.name));
      }
    } else if (allowedExts.has(extname(cur))) {
      results.push(cur);
    }
  }
  return results;
}

function isTestFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.includes("/__tests__/") ||
    normalized.includes("/src/test/") ||
    normalized.includes("/test/") ||
    normalized.includes("/e2e/") ||
    normalized.endsWith(".test.ts") ||
    normalized.endsWith(".test.tsx") ||
    normalized.endsWith(".spec.ts") ||
    normalized.endsWith(".spec.tsx")
  );
}

function rel(repoRoot: string, abs: string): string {
  return relative(repoRoot, abs);
}

function findFilesContainingLiteral(
  searchDir: string,
  literal: string,
  options: { excludeTests?: boolean; includeJavaScript?: boolean } = {},
): string[] {
  if (!literal) return [];
  const { excludeTests = true, includeJavaScript = false } = options;
  const allowedExts = includeJavaScript ? CODE_EXTS : SOURCE_EXTS;
  const files = walkFiles(searchDir, allowedExts);
  return files.filter((filePath) => {
    if (excludeTests && isTestFile(filePath)) return false;
    try {
      return readFileSync(filePath, "utf8").includes(literal);
    } catch {
      return false;
    }
  });
}

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths.map((filePath) => resolve(filePath))));
}

function filterOutFile(paths: string[], excludedFile: string): string[] {
  const excluded = resolve(excludedFile);
  return uniquePaths(paths).filter((filePath) => filePath !== excluded);
}

function getAppRoot(cfg: AppConfig, repoRoot: string): string {
  return join(repoRoot, dirname(cfg.srcRoot));
}

function parseRouteLiterals(content: string): Set<string> {
  const routes = new Set<string>();
  for (const match of content.matchAll(/route:\s*["']([^"']+)["']/g)) {
    routes.add(match[1]!);
  }
  return routes;
}

function parseObjectStringValues(content: string, objectName: string): Set<string> {
  const values = new Set<string>();
  const marker = `${objectName}`;
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) return values;
  const objectStart = content.indexOf("{", markerIndex);
  const objectEnd = content.indexOf("\n};", objectStart);
  if (objectStart === -1 || objectEnd === -1) return values;
  const objectBody = content.slice(objectStart + 1, objectEnd);
  for (const valueMatch of objectBody.matchAll(/:\s*["']([^"']+)["']/g)) {
    values.add(valueMatch[1]!);
  }
  return values;
}

function addInboundEdge(map: Map<string, Set<string>>, targetPath: string, importerPath: string): void {
  const target = resolve(targetPath);
  const importer = resolve(importerPath);
  const existing = map.get(target);
  if (existing) {
    existing.add(importer);
    return;
  }
  map.set(target, new Set([importer]));
}

function resolveExistingModuleFile(candidateBase: string): string | null {
  const candidates = [
    candidateBase,
    `${candidateBase}.ts`,
    `${candidateBase}.tsx`,
    `${candidateBase}.js`,
    `${candidateBase}.jsx`,
    `${candidateBase}.mjs`,
    `${candidateBase}.cjs`,
    join(candidateBase, "index.ts"),
    join(candidateBase, "index.tsx"),
    join(candidateBase, "index.js"),
    join(candidateBase, "index.jsx"),
    join(candidateBase, "index.mjs"),
    join(candidateBase, "index.cjs"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return resolve(candidate);
    }
  }

  return null;
}

function resolveAppModuleSpecifier(importerFile: string, specifier: string, srcRoot: string): string | null {
  if (specifier.startsWith("@/")) {
    return resolveExistingModuleFile(join(srcRoot, specifier.slice(2)));
  }
  if (specifier.startsWith(".")) {
    return resolveExistingModuleFile(resolve(dirname(importerFile), specifier));
  }
  return null;
}

function getScriptKind(filePath: string): ts.ScriptKind {
  const extension = extname(filePath);
  if (extension === ".tsx") return ts.ScriptKind.TSX;
  if (extension === ".jsx") return ts.ScriptKind.JSX;
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function collectModuleSpecifiers(sourceText: string, filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );
  const specifiers = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier
      && ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node)
      && node.arguments.length > 0
      && ts.isStringLiteralLike(node.arguments[0]!)
    ) {
      const firstArg = node.arguments[0]!;
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequireCall = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isDynamicImport || isRequireCall) {
        specifiers.add(firstArg.text);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return Array.from(specifiers);
}

function buildModuleGraph(app: AppId, cfg: AppConfig, repoRoot: string): ModuleGraph {
  const cacheKey = `${repoRoot}:${app}`;
  const cached = MODULE_GRAPH_CACHE.get(cacheKey);
  if (cached) return cached;

  const srcRoot = join(repoRoot, cfg.srcRoot);
  const graphRoots = (cfg.moduleGraphRoots ?? [cfg.srcRoot]).map((root) => join(repoRoot, root));

  const graph: ModuleGraph = {
    productionInbound: new Map<string, Set<string>>(),
    testInbound: new Map<string, Set<string>>(),
  };

  for (const graphRoot of graphRoots) {
    for (const sourceFilePath of walkFiles(graphRoot, SOURCE_EXTS)) {
      const importerPath = resolve(sourceFilePath);
      const importerIsTest = isTestFile(importerPath);
      const sourceText = readFileSync(sourceFilePath, "utf8");
      for (const specifier of collectModuleSpecifiers(sourceText, sourceFilePath)) {
        const dependencyPath = resolveAppModuleSpecifier(sourceFilePath, specifier, srcRoot);
        if (!dependencyPath) continue;
        if (!dependencyPath.startsWith(resolve(srcRoot))) continue;
        if (!SOURCE_EXTS.has(extname(dependencyPath))) continue;
        addInboundEdge(
          importerIsTest ? graph.testInbound : graph.productionInbound,
          dependencyPath,
          importerPath,
        );
      }
    }
  }

  MODULE_GRAPH_CACHE.set(cacheKey, graph);
  return graph;
}

// ─── Git utilities ────────────────────────────────────────────────────────────

function gitLastModifiedDaysAgo(repoRoot: string, relPath: string): number | null {
  try {
    const out = execFileSync(
      "git",
      ["log", "--follow", "-1", "--format=%ct", "--", relPath],
      { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const ts = parseInt(out.trim(), 10);
    if (isNaN(ts)) return null;
    return Math.floor((Date.now() / 1000 - ts) / 86400);
  } catch {
    return null;
  }
}

function recentlyModified(repoRoot: string, relPath: string, thresholdDays = 14): boolean {
  const days = gitLastModifiedDaysAgo(repoRoot, relPath);
  if (days === null) return false;
  return days <= thresholdDays;
}

function downgradeIfRecent(
  confidence: Confidence,
  repoRoot: string,
  relPath: string,
): { confidence: Confidence; note?: string } {
  if (confidence === "high" && recentlyModified(repoRoot, relPath)) {
    return { confidence: "medium", note: "recently modified — verify before removing" };
  }
  if (confidence === "medium" && recentlyModified(repoRoot, relPath)) {
    return { confidence: "low", note: "recently modified — likely still in use" };
  }
  return { confidence };
}

// ─── Phase 1: Page reachability ───────────────────────────────────────────────

function auditPages(app: AppId, cfg: AppConfig, repoRoot: string): Finding[] {
  const findings: Finding[] = [];
  const appDir = join(repoRoot, cfg.appDir);
  if (!existsSync(appDir)) return findings;

  if (app === "reception") {
    return auditReceptionPages(cfg, repoRoot, appDir, findings);
  } else if (app === "brikette") {
    return auditBrikettePages(cfg, repoRoot, appDir, findings);
  } else if (app === "xa-uploader") {
    return auditXaUploaderPages(cfg, repoRoot, appDir, findings);
  } else if (app === "prime") {
    return auditPrimePages(cfg, repoRoot, appDir, findings);
  }
  return findings;
}

function auditReceptionPages(
  cfg: AppConfig,
  repoRoot: string,
  appDir: string,
  findings: Finding[],
): Finding[] {
  const navFile = join(repoRoot, cfg.srcRoot, "components/appNav/navConfig.ts");
  const navRoutes = existsSync(navFile)
    ? parseRouteLiterals(readFileSync(navFile, "utf8"))
    : new Set<string>();

  // Find all directories under appDir that have a page.tsx (skip api, __tests__, special files)
  const skipEntries = new Set(["api", "__tests__", "_api-off", "_lib"]);
  const srcRoot = join(repoRoot, cfg.srcRoot);
  const entries = readdirSync(appDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (skipEntries.has(entry.name)) continue;
    const routePath = `/${entry.name}`;
    const pagePath = join(appDir, entry.name, "page.tsx");
    if (!existsSync(pagePath)) continue;

    if (!navRoutes.has(routePath)) {
      const relPath = rel(repoRoot, pagePath);
      const productionRefs = filterOutFile(
        findFilesContainingLiteral(srcRoot, routePath, { excludeTests: true }),
        pagePath,
      );
      if (productionRefs.length > 0) {
        continue;
      }
      const testRefs = filterOutFile(
        findFilesContainingLiteral(srcRoot, routePath, { excludeTests: false }).filter(isTestFile),
        pagePath,
      );
      const baseConfidence: Confidence = testRefs.length > 0
        ? "low"
        : "medium";
      const evidenceNote = testRefs.length > 0
        ? `route string appears in ${testRefs.length} test file(s)`
        : undefined;
      const { confidence, note } = downgradeIfRecent(baseConfidence, repoRoot, relPath);
      findings.push({
        app: "reception",
        category: "pages",
        filePath: relPath,
        displayPath: `app/${entry.name}/page.tsx`,
        reason: `Route "${routePath}" is not in appNav/navConfig.ts`,
        confidence,
        note: [evidenceNote, note].filter(Boolean).join("; ") || undefined,
      });
    }
  }
  return findings;
}

function auditBrikettePages(
  cfg: AppConfig,
  repoRoot: string,
  appDir: string,
  findings: Finding[],
): Finding[] {
  const langDir = join(appDir, "[lang]");
  if (!existsSync(langDir)) return findings;
  const srcRoot = join(repoRoot, cfg.srcRoot);
  const sectionSegmentsFile = join(repoRoot, cfg.srcRoot, "routing/sectionSegments.ts");
  const slugMapFile = join(repoRoot, cfg.srcRoot, "slug-map.ts");
  const validInternalSegments = new Set<string>(["draft"]);
  if (existsSync(sectionSegmentsFile)) {
    for (const segment of parseObjectStringValues(readFileSync(sectionSegmentsFile, "utf8"), "INTERNAL_SEGMENT_BY_KEY")) {
      validInternalSegments.add(segment.split("/")[0]!);
    }
  }
  if (existsSync(slugMapFile)) {
    const slugMapContent = readFileSync(slugMapFile, "utf8");
    for (const match of slugMapContent.matchAll(/en:\s*["']([^"']+)["']/g)) {
      validInternalSegments.add(match[1]!.split("/")[0]!);
    }
  }

  const skipEntries = new Set(["_api-off"]);
  const entries = readdirSync(langDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirName = entry.name;

    // [localizedSection] or similar dynamic catch-alls — skip
    if (dirName.startsWith("[")) continue;

    // _api-off or similar disabled prefixes — these are always dead
    if (dirName.startsWith("_") || skipEntries.has(dirName)) {
      const relPath = rel(repoRoot, join(langDir, dirName));
      findings.push({
        app: "brikette",
        category: "pages",
        filePath: relPath,
        displayPath: `app/[lang]/${dirName}/`,
        reason: `Directory starts with "_" — disabled by Next.js naming convention`,
        confidence: "high",
      });
      continue;
    }

    const pagePath = join(langDir, dirName, "page.tsx");
    if (!existsSync(pagePath)) continue;

    if (!validInternalSegments.has(dirName)) {
      const relPath = rel(repoRoot, pagePath);
      const productionRefs = filterOutFile(
        [
          ...findFilesContainingLiteral(srcRoot, `/${dirName}`, { excludeTests: true }),
          ...findFilesContainingLiteral(srcRoot, dirName, { excludeTests: true }),
        ],
        pagePath,
      );
      const testRefs = filterOutFile(
        [
          ...findFilesContainingLiteral(srcRoot, `/${dirName}`, { excludeTests: false }).filter(isTestFile),
          ...findFilesContainingLiteral(srcRoot, dirName, { excludeTests: false }).filter(isTestFile),
        ],
        pagePath,
      );
      const baseConfidence: Confidence = productionRefs.length > 0 || testRefs.length > 0
        ? "low"
        : "medium";
      const evidenceNote = productionRefs.length > 0
        ? `segment appears in ${productionRefs.length} production file(s)`
        : testRefs.length > 0
          ? `segment appears in ${testRefs.length} test file(s)`
          : undefined;
      const { confidence, note } = downgradeIfRecent(baseConfidence, repoRoot, relPath);
      findings.push({
        app: "brikette",
        category: "pages",
        filePath: relPath,
        displayPath: `app/[lang]/${dirName}/page.tsx`,
        reason: `Route segment "${dirName}" is not in routing/sectionSegments.ts internal segment registry`,
        confidence,
        note: [evidenceNote, note].filter(Boolean).join("; ") || undefined,
      });
    }
  }

  // Check for explicitly disabled API routes in brikette
  const apiOffDir = join(appDir, "_api-off");
  if (existsSync(apiOffDir)) {
    const routeFiles = walkFiles(apiOffDir).filter((f) => basename(f) === "route.ts");
    for (const routeFile of routeFiles) {
      const relPath = rel(repoRoot, routeFile);
      findings.push({
        app: "brikette",
        category: "pages",
        filePath: relPath,
        displayPath: relPath.replace(/.*apps\/brikette\/src\/app\//, "app/"),
        reason: `Route is inside "_api-off/" directory — disabled by naming convention`,
        confidence: "high",
      });
    }
  }

  return findings;
}

function auditXaUploaderPages(
  cfg: AppConfig,
  repoRoot: string,
  appDir: string,
  findings: Finding[],
): Finding[] {
  const knownRoutes = new Set(["/", "/login", "/[storefront]"]);
  const srcRoot = join(repoRoot, cfg.srcRoot);
  const entries = readdirSync(appDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const routePath = `/${entry.name}`;
    const pagePath = join(appDir, entry.name, "page.tsx");
    if (!existsSync(pagePath)) continue;
    if (!knownRoutes.has(routePath)) {
      const relPath = rel(repoRoot, pagePath);
      const productionRefs = filterOutFile(
        findFilesContainingLiteral(srcRoot, routePath, { excludeTests: true }),
        pagePath,
      );
      const testRefs = filterOutFile(
        findFilesContainingLiteral(srcRoot, routePath, { excludeTests: false }).filter(isTestFile),
        pagePath,
      );
      const baseConfidence: Confidence = productionRefs.length > 0 || testRefs.length > 0
        ? "low"
        : "medium";
      const evidenceNote = productionRefs.length > 0
        ? `route string appears in ${productionRefs.length} production file(s)`
        : testRefs.length > 0
          ? `route string appears in ${testRefs.length} test file(s)`
          : undefined;
      const { confidence, note } = downgradeIfRecent(baseConfidence, repoRoot, relPath);
      findings.push({
        app: "xa-uploader",
        category: "pages",
        filePath: relPath,
        displayPath: `app/${entry.name}/page.tsx`,
        reason: `Route "${routePath}" not in known xa-uploader routes (/, /login)`,
        confidence,
        note: [evidenceNote, note].filter(Boolean).join("; ") || undefined,
      });
    }
  }
  return findings;
}

function pageFileToPublicRoute(pagePath: string, appDir: string): string | null {
  const relativePath = relative(appDir, pagePath).replace(/\\/g, "/");
  if (relativePath === "page.tsx") return "/";
  if (!relativePath.endsWith("/page.tsx")) return null;

  const rawSegments = relativePath.replace(/\/page\.tsx$/, "").split("/");
  const segments = rawSegments.filter((segment) => segment.length > 0 && !/^\(.+\)$/.test(segment));

  return `/${segments.join("/")}`;
}

function auditPrimePages(
  cfg: AppConfig,
  repoRoot: string,
  appDir: string,
  findings: Finding[],
): Finding[] {
  const srcRoot = join(repoRoot, cfg.srcRoot);
  const pageFiles = walkFiles(appDir).filter((filePath) => basename(filePath) === "page.tsx");
  const knownLiveUnlinkedRoutes = new Set(cfg.knownLiveUnlinkedRoutes ?? []);

  for (const pagePath of pageFiles) {
    if (isTestFile(pagePath)) continue;

    const routePath = pageFileToPublicRoute(pagePath, appDir);
    if (!routePath || routePath === "/") continue;
    if (knownLiveUnlinkedRoutes.has(routePath)) continue;

    const pageContent = readFileSync(pagePath, "utf8");
    if (isSimpleRedirectAliasPage(pageContent)) continue;

    const relPath = rel(repoRoot, pagePath);
    const productionRefs = filterOutFile(
      findFilesContainingLiteral(srcRoot, routePath, { excludeTests: true }),
      pagePath,
    );
    if (productionRefs.length > 0) {
      continue;
    }

    const testRefs = filterOutFile(
      findFilesContainingLiteral(srcRoot, routePath, { excludeTests: false }).filter(isTestFile),
      pagePath,
    );
    const baseConfidence: Confidence = testRefs.length > 0 ? "low" : "medium";
    const evidenceNote = testRefs.length > 0
      ? `route string appears in ${testRefs.length} test file(s)`
      : undefined;
    const { confidence, note } = downgradeIfRecent(baseConfidence, repoRoot, relPath);
    findings.push({
      app: "prime",
      category: "pages",
      filePath: relPath,
      displayPath: relPath.replace(/.*apps\/prime\/src\/app\//, "app/"),
      reason: `No production route reference found for "${routePath}" in Prime app source`,
      confidence,
      note: [evidenceNote, note].filter(Boolean).join("; ") || undefined,
    });
  }

  return findings;
}

function isSimpleRedirectAliasPage(pageContent: string): boolean {
  return (
    pageContent.includes("GuardedRouteRedirect")
    || /redirect\s*\(/.test(pageContent)
    || /permanentRedirect\s*\(/.test(pageContent)
  );
}

// ─── Phase 2: API route call graph ───────────────────────────────────────────

/**
 * Classify an API route as needing special treatment (lower confidence when unfound).
 * External callers (MCP, webhooks, deploy hooks) are expected to not appear in
 * the app's own source code.
 */
function classifyApiRoute(urlPath: string): { externalCaller: boolean; reason: string } {
  if (urlPath.includes("/mcp/")) {
    return { externalCaller: true, reason: "MCP route — called by external agent tools" };
  }
  if (urlPath.includes("/internal/")) {
    return { externalCaller: true, reason: "Internal route — may be called by cron/webhooks" };
  }
  if (urlPath.includes("deploy-drain") || urlPath.includes("/sync") || urlPath.includes("gmail-adapter")) {
    return { externalCaller: true, reason: "Infrastructure route — may be called by external systems" };
  }
  return { externalCaller: false, reason: "" };
}

function fileSystemPathToUrlPath(absPath: string, appDir: string): string {
  // Strip appDir prefix and /route.ts suffix
  const rel = relative(appDir, absPath);
  return "/" + rel.replace(/\/route\.ts$/, "").replace(/\\/g, "/");
}

function literalPrefix(urlPath: string): string {
  // Return the longest literal segment before the first dynamic [param]
  const idx = urlPath.indexOf("[");
  if (idx === -1) return urlPath;
  return urlPath.slice(0, idx);
}

function auditApiRoutes(app: AppId, cfg: AppConfig, repoRoot: string): Finding[] {
  const findings: Finding[] = [];
  const apiDir = join(repoRoot, cfg.apiDir);
  if (!existsSync(apiDir)) return findings;

  const routeFiles = walkFiles(apiDir).filter((f) => basename(f) === "route.ts");
  const appRoot = getAppRoot(cfg, repoRoot);

  for (const routeFile of routeFiles) {
    const urlPath = fileSystemPathToUrlPath(routeFile, join(repoRoot, cfg.appDir));
    const prefix = literalPrefix(urlPath);
    const relPath = rel(repoRoot, routeFile);

    const callers = filterOutFile(
      [
        ...findFilesContainingLiteral(appRoot, urlPath, { excludeTests: true, includeJavaScript: true }),
        ...findFilesContainingLiteral(appRoot, prefix, { excludeTests: true, includeJavaScript: true }),
      ],
      routeFile,
    );

    if (callers.length === 0) {
      const testCallers = filterOutFile(
        [
          ...findFilesContainingLiteral(appRoot, urlPath, { excludeTests: false, includeJavaScript: true }).filter(isTestFile),
          ...findFilesContainingLiteral(appRoot, prefix, { excludeTests: false, includeJavaScript: true }).filter(isTestFile),
        ],
        routeFile,
      );

      const { externalCaller, reason: extReason } = classifyApiRoute(urlPath);

      let confidence: Confidence;
      let reason: string;

      if (externalCaller) {
        confidence = "low";
        reason = `No in-repo literal route reference found for "${urlPath}" — ${extReason}`;
      } else if (testCallers.length > 0) {
        confidence = "medium";
        reason = `"${urlPath}" is only referenced in tests, not in production code`;
      } else {
        confidence = "medium";
        reason = `No in-repo literal route reference found for "${urlPath}"`;
      }

      const { confidence: finalConf, note } = downgradeIfRecent(confidence, repoRoot, relPath);
      findings.push({
        app,
        category: "api",
        filePath: relPath,
        displayPath: relPath.replace(/.*apps\/[^/]+\/src\/app\//, "app/"),
        reason,
        confidence: finalConf,
        note,
      });
    }
  }

  return findings;
}

// ─── Phase 3: Export/file reachability ───────────────────────────────────────

function auditExports(app: AppId, cfg: AppConfig, repoRoot: string): Finding[] {
  const findings: Finding[] = [];
  const graph = buildModuleGraph(app, cfg, repoRoot);

  for (const scanDir of cfg.productionDirs) {
    const absDir = join(repoRoot, scanDir);
    if (!existsSync(absDir)) continue;

    const files = walkFiles(absDir).filter((f) => !isTestFile(f));

    for (const file of files) {
      const relPath = rel(repoRoot, file);
      const resolvedFile = resolve(file);
      const productionImporters = Array.from(graph.productionInbound.get(resolvedFile) ?? [])
        .filter((importer) => importer !== resolvedFile);

      if (productionImporters.length > 0) continue; // Has production importers — not dead

      const testImporters = Array.from(graph.testInbound.get(resolvedFile) ?? [])
        .filter((importer) => importer !== resolvedFile);

      let confidence: Confidence;
      let reason: string;

      if (testImporters.length > 0) {
        confidence = "low";
        reason = `No production imports found in app module graph — only referenced in ${testImporters.length} test file(s)`;
      } else {
        confidence = "medium";
        reason = `No static imports or re-exports found in app module graph`;
      }

      const { confidence: finalConf, note } = downgradeIfRecent(confidence, repoRoot, relPath);
      findings.push({
        app,
        category: "exports",
        filePath: relPath,
        displayPath: relPath.replace(/.*apps\/[^/]+\/src\//, "src/"),
        reason,
        confidence: finalConf,
        note,
      });
    }
  }

  return findings;
}

// ─── Phase 4: Feature flag detection ─────────────────────────────────────────

function auditFeatureFlags(app: AppId, cfg: AppConfig, repoRoot: string): Finding[] {
  const findings: Finding[] = [];
  if (!cfg.envFile) return findings;

  const envFile = join(repoRoot, cfg.envFile);
  if (!existsSync(envFile)) return findings;

  const content = readFileSync(envFile, "utf8");
  const relPath = rel(repoRoot, envFile);
  const appRoot = getAppRoot(cfg, repoRoot);

  // Find boolean flags: `export const FOO = readEnv([...]) === "1"`
  const flagRegex = /export const (\w+)\s*=\s*readEnv\(\[([^\]]+)\]\)\s*===\s*["']1["']/g;
  for (const m of content.matchAll(flagRegex)) {
    const flagName = m[1]!;
    const keysRaw = m[2]!;
    const envKeys = keysRaw.match(/["']([^"']+)["']/g)?.map((k) => k.replace(/["']/g, "")) ?? [];

    // Check if any of these keys appear in .env.example
    let appearsInExample = false;
    if (cfg.envExampleFile) {
      const exampleFile = join(repoRoot, cfg.envExampleFile);
      if (existsSync(exampleFile)) {
        const exampleContent = readFileSync(exampleFile, "utf8");
        appearsInExample = envKeys.some((k) => {
          return exampleContent
            .split(/\r?\n/)
            .some((line) => line.match(/^\s*(?:#\s*)?([A-Z0-9_]+)\s*=/)?.[1] === k);
        });
      }
    }

    const flagUsages = filterOutFile(
      findFilesContainingLiteral(appRoot, flagName, { excludeTests: true, includeJavaScript: true }),
      envFile,
    );
    const envKeyUsages = uniquePaths(
      envKeys.flatMap((key) =>
        findFilesContainingLiteral(appRoot, key, { excludeTests: true, includeJavaScript: true }),
      ),
    ).filter((filePath) => filePath !== resolve(envFile));

    if (flagUsages.length === 0 && envKeyUsages.length === 0) {
      const reason = appearsInExample
        ? `Flag "${flagName}" defined but never referenced outside config/env.ts`
        : `Flag "${flagName}" env vars (${envKeys.join(", ")}) absent from .env.example and never referenced outside config/env.ts`;

      findings.push({
        app,
        category: "flags",
        filePath: relPath,
        displayPath: `config/env.ts → ${flagName}`,
        reason,
        confidence: "medium",
        note: `Env vars: ${envKeys.join(", ")}`,
      });
    }
  }

  return findings;
}

// ─── Report rendering ─────────────────────────────────────────────────────────

function countByConf(findings: Finding[], conf: Confidence): number {
  return findings.filter((f) => f.confidence === conf).length;
}

function renderMarkdown(findings: Finding[]): string {
  const now = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];

  lines.push(`# Dead Code Audit — ${now}`, "");
  lines.push(
    "Findings are ranked by confidence: **high** = very likely dead, " +
    "**medium** = needs review, **low** = probably still needed (external callers etc.)",
    "",
  );

  // Summary table
  const cats: Category[] = ["api", "pages", "exports", "flags"];
  const catLabels: Record<Category, string> = {
    api: "API Routes",
    pages: "Pages",
    exports: "Exports / Files",
    flags: "Feature Flags",
  };
  lines.push("## Summary", "");
  lines.push("| Category | High | Medium | Low | Total |");
  lines.push("|---|---|---|---|---|");
  let totalHigh = 0, totalMed = 0, totalLow = 0;
  for (const cat of cats) {
    const catFindings = findings.filter((f) => f.category === cat);
    const h = countByConf(catFindings, "high");
    const m = countByConf(catFindings, "medium");
    const l = countByConf(catFindings, "low");
    totalHigh += h; totalMed += m; totalLow += l;
    lines.push(`| ${catLabels[cat]} | ${h} | ${m} | ${l} | ${catFindings.length} |`);
  }
  lines.push(`| **Total** | **${totalHigh}** | **${totalMed}** | **${totalLow}** | **${findings.length}** |`);
  lines.push("");

  // Sections per category
  for (const cat of cats) {
    const catFindings = findings
      .filter((f) => f.category === cat)
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.confidence] - order[b.confidence];
      });
    if (catFindings.length === 0) continue;

    lines.push(`## ${catLabels[cat]}`, "");
    for (const f of catFindings) {
      const badge = f.confidence === "high" ? "🔴 HIGH" : f.confidence === "medium" ? "🟡 MEDIUM" : "🟢 LOW";
      lines.push(`### \`${f.displayPath}\``);
      lines.push(`- **App**: ${f.app}`);
      lines.push(`- **Confidence**: ${badge}`);
      lines.push(`- **Reason**: ${f.reason}`);
      if (f.note) lines.push(`- **Note**: ${f.note}`);
      lines.push(`- **File**: \`${f.filePath}\``);
      lines.push("");
    }
  }

  if (findings.length === 0) {
    lines.push("No dead code findings. The codebase looks clean.", "");
  }

  return lines.join("\n");
}

function renderJson(findings: Finding[]): string {
  return JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      finding_count: findings.length,
      high_count: countByConf(findings, "high"),
      medium_count: countByConf(findings, "medium"),
      low_count: countByConf(findings, "low"),
      findings,
    },
    null,
    2,
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function runDeadCodeAudit(options: CliOptions): Finding[] {
  const { apps, categories, format, repoRoot } = options;

  const allFindings: Finding[] = [];

  for (const app of apps) {
    const cfg = APP_CONFIGS[app];

    if (categories.includes("pages")) {
      allFindings.push(...auditPages(app, cfg, repoRoot));
    }
    if (categories.includes("api")) {
      allFindings.push(...auditApiRoutes(app, cfg, repoRoot));
    }
    if (categories.includes("exports")) {
      allFindings.push(...auditExports(app, cfg, repoRoot));
    }
    if (categories.includes("flags")) {
      allFindings.push(...auditFeatureFlags(app, cfg, repoRoot));
    }
  }

  void format;
  return allFindings;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const { apps, categories, format } = options;

  process.stderr.write(`Dead code audit: apps=[${apps.join(",")}] categories=[${categories.join(",")}]\n`);
  process.stderr.write(`  Scanning requested apps...\n`);

  const allFindings = runDeadCodeAudit(options);

  process.stderr.write(`  Done. ${allFindings.length} findings.\n\n`);

  const output = format === "json" ? renderJson(allFindings) : renderMarkdown(allFindings);
  process.stdout.write(output + "\n");

  const hasHigh = allFindings.some((f) => f.confidence === "high");
  process.exitCode = hasHigh ? 1 : 0;
}

function isDirectExecution(): boolean {
  const argvEntry = process.argv[1];
  if (!argvEntry) return false;
  return resolve(argvEntry) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  main();
}
