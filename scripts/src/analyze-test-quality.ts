#!/usr/bin/env ts-node
/**
 * Test Quality Analyzer
 *
 * Scans test files for quality patterns and anti-patterns.
 * Part of the Test Quality Audit (AUDIT-01).
 *
 * Usage:
 *   pnpm analyze-test-quality [package-filter]
 *
 * Examples:
 *   pnpm analyze-test-quality                    # Analyze all packages
 *   pnpm analyze-test-quality @acme/auth         # Analyze specific package
 *   pnpm analyze-test-quality packages/config    # Analyze by path
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

// ============================================================================
// Types
// ============================================================================

interface TestFileAnalysis {
  path: string;
  relativePath: string;
  package: string;
  metrics: {
    mockCount: number;
    spyOnCount: number;
    snapshotCount: number;
    assertionCount: number;
    testCount: number;
    describeCount: number;
    weakAssertionCount: number;
    toHaveBeenCalledWithoutArgsCount: number;
    implementationCouplingPatterns: string[];
    isolationIssues: string[];
  };
  scores: {
    mockFidelity: number; // 1-5, higher = less mocking
    implementationCoupling: number; // 1-5, higher = less coupled
    assertionClarity: number; // 1-5, higher = clearer
    isolation: number; // 1-5, higher = better isolation
    overall: number; // weighted average
  };
  flags: string[];
}

interface PackageAnalysis {
  name: string;
  path: string;
  testFiles: TestFileAnalysis[];
  summary: {
    totalTests: number;
    totalAssertions: number;
    totalMocks: number;
    averageScores: {
      mockFidelity: number;
      implementationCoupling: number;
      assertionClarity: number;
      isolation: number;
      overall: number;
    };
    flaggedFiles: number;
    criticalIssues: string[];
  };
}

interface AuditReport {
  generatedAt: string;
  packagesAnalyzed: number;
  totalTestFiles: number;
  packages: PackageAnalysis[];
  overallScores: {
    mockFidelity: number;
    implementationCoupling: number;
    assertionClarity: number;
    isolation: number;
    overall: number;
  };
  topIssues: Array<{ file: string; issue: string; severity: "high" | "medium" | "low" }>;
}

// ============================================================================
// Pattern Detection
// ============================================================================

const PATTERNS = {
  // Mocking patterns
  jestMock: /jest\.mock\s*\(/g,
  jestSpyOn: /jest\.spyOn\s*\(/g,
  jestDoMock: /jest\.doMock\s*\(/g,

  // Snapshot patterns
  toMatchSnapshot: /\.toMatchSnapshot\s*\(/g,
  toMatchInlineSnapshot: /\.toMatchInlineSnapshot\s*\(/g,

  // Assertion patterns
  expect: /expect\s*\(/g,
  toHaveBeenCalled: /\.toHaveBeenCalled\s*\(\s*\)/g, // without args
  toHaveBeenCalledWith: /\.toHaveBeenCalledWith\s*\(/g,
  toBeTruthy: /\.toBeTruthy\s*\(\s*\)/g,
  toBeFalsy: /\.toBeFalsy\s*\(\s*\)/g,
  toBeDefined: /\.toBeDefined\s*\(\s*\)/g,
  toBeUndefined: /\.toBeUndefined\s*\(\s*\)/g,

  // Test structure
  itOrTest: /\b(it|test)\s*\(/g,
  describe: /\bdescribe\s*\(/g,
  beforeEach: /\bbeforeEach\s*\(/g,
  afterEach: /\bafterEach\s*\(/g,
  beforeAll: /\bbeforeAll\s*\(/g,
  afterAll: /\bafterAll\s*\(/g,

  // Implementation coupling patterns (anti-patterns)
  privateAccess: /\._[a-zA-Z]/g, // accessing _private members
  prototypeAccess: /\.prototype\./g,
  internalMethodSpy: /spyOn\s*\([^)]+,\s*['"]_/g, // spying on _private methods
  stateAccess: /\.state\./g, // direct state access in React

  // Isolation issues
  globalMutation: /global\.[a-zA-Z]+\s*=/g,
  windowMutation: /window\.[a-zA-Z]+\s*=/g,
  processMutation: /process\.env\.[a-zA-Z]+\s*=/g,
  missingCleanup: /jest\.mock\s*\([^)]+\)(?![\s\S]*jest\.unmock)/g, // mock without unmock (heuristic)
};

function countMatches(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function findPatternContexts(content: string, pattern: RegExp): string[] {
  const contexts: string[] = [];
  const lines = content.split("\n");
  let match;

  // Reset regex state
  pattern.lastIndex = 0;

  while ((match = pattern.exec(content)) !== null) {
    // Find line number
    const beforeMatch = content.substring(0, match.index);
    const lineNumber = beforeMatch.split("\n").length;

    // Get surrounding context (the line itself)
    if (lineNumber > 0 && lineNumber <= lines.length) {
      const line = lines[lineNumber - 1].trim();
      if (line.length < 200) {
        // Avoid huge lines
        contexts.push(`L${lineNumber}: ${line.substring(0, 100)}`);
      }
    }
  }

  return contexts;
}

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeTestFile(filePath: string, rootDir: string): TestFileAnalysis {
  const content = readFileSync(filePath, "utf-8");
  const relativePath = relative(rootDir, filePath);
  const packageName = extractPackageName(filePath, rootDir);

  // Count patterns
  const mockCount = countMatches(content, PATTERNS.jestMock) + countMatches(content, PATTERNS.jestDoMock);
  const spyOnCount = countMatches(content, PATTERNS.jestSpyOn);
  const snapshotCount =
    countMatches(content, PATTERNS.toMatchSnapshot) + countMatches(content, PATTERNS.toMatchInlineSnapshot);
  const assertionCount = countMatches(content, PATTERNS.expect);
  const testCount = countMatches(content, PATTERNS.itOrTest);
  const describeCount = countMatches(content, PATTERNS.describe);

  // Weak assertions
  const weakAssertionCount =
    countMatches(content, PATTERNS.toBeTruthy) +
    countMatches(content, PATTERNS.toBeFalsy) +
    countMatches(content, PATTERNS.toBeDefined) +
    countMatches(content, PATTERNS.toBeUndefined);

  // toHaveBeenCalled without args (weaker than toHaveBeenCalledWith)
  const toHaveBeenCalledWithoutArgsCount = countMatches(content, PATTERNS.toHaveBeenCalled);

  // Implementation coupling patterns
  const implementationCouplingPatterns: string[] = [];
  if (PATTERNS.privateAccess.test(content)) {
    implementationCouplingPatterns.push("private-member-access");
  }
  if (PATTERNS.prototypeAccess.test(content)) {
    implementationCouplingPatterns.push("prototype-access");
  }
  if (PATTERNS.internalMethodSpy.test(content)) {
    implementationCouplingPatterns.push("internal-method-spy");
  }
  if (PATTERNS.stateAccess.test(content)) {
    implementationCouplingPatterns.push("direct-state-access");
  }

  // Isolation issues
  const isolationIssues: string[] = [];
  if (PATTERNS.globalMutation.test(content)) {
    isolationIssues.push("global-mutation");
  }
  if (PATTERNS.windowMutation.test(content)) {
    isolationIssues.push("window-mutation");
  }
  if (PATTERNS.processMutation.test(content)) {
    // Check if it's properly cleaned up
    const hasBeforeEach = PATTERNS.beforeEach.test(content);
    const hasAfterEach = PATTERNS.afterEach.test(content);
    if (!hasBeforeEach && !hasAfterEach) {
      isolationIssues.push("env-mutation-no-cleanup");
    }
  }

  // Calculate scores
  const scores = calculateScores({
    mockCount,
    spyOnCount,
    snapshotCount,
    assertionCount,
    testCount,
    weakAssertionCount,
    toHaveBeenCalledWithoutArgsCount,
    implementationCouplingPatterns,
    isolationIssues,
  });

  // Generate flags
  const flags: string[] = [];

  if (mockCount > 5) flags.push("high-mock-count");
  if (snapshotCount > 3) flags.push("heavy-snapshot-usage");
  if (testCount > 0 && assertionCount / testCount < 1.5) flags.push("low-assertion-density");
  if (weakAssertionCount > assertionCount * 0.3) flags.push("many-weak-assertions");
  if (implementationCouplingPatterns.length > 0) flags.push("implementation-coupled");
  if (isolationIssues.length > 0) flags.push("isolation-concerns");
  if (scores.overall < 3) flags.push("needs-review");

  return {
    path: filePath,
    relativePath,
    package: packageName,
    metrics: {
      mockCount,
      spyOnCount,
      snapshotCount,
      assertionCount,
      testCount,
      describeCount,
      weakAssertionCount,
      toHaveBeenCalledWithoutArgsCount,
      implementationCouplingPatterns,
      isolationIssues,
    },
    scores,
    flags,
  };
}

function calculateScores(metrics: {
  mockCount: number;
  spyOnCount: number;
  snapshotCount: number;
  assertionCount: number;
  testCount: number;
  weakAssertionCount: number;
  toHaveBeenCalledWithoutArgsCount: number;
  implementationCouplingPatterns: string[];
  isolationIssues: string[];
}): TestFileAnalysis["scores"] {
  // Mock Fidelity (1-5): Fewer mocks = higher score
  const totalMocks = metrics.mockCount + metrics.spyOnCount;
  let mockFidelity: number;
  if (totalMocks === 0) mockFidelity = 5;
  else if (totalMocks <= 2) mockFidelity = 4;
  else if (totalMocks <= 4) mockFidelity = 3;
  else if (totalMocks <= 7) mockFidelity = 2;
  else mockFidelity = 1;

  // Implementation Coupling (1-5): Fewer anti-patterns = higher score
  const couplingIssues = metrics.implementationCouplingPatterns.length;
  let implementationCoupling: number;
  if (couplingIssues === 0) implementationCoupling = 5;
  else if (couplingIssues === 1) implementationCoupling = 3;
  else implementationCoupling = 1;

  // Assertion Clarity (1-5): Fewer weak assertions = higher score
  const weakRatio = metrics.assertionCount > 0 ? metrics.weakAssertionCount / metrics.assertionCount : 0;
  const snapshotRatio = metrics.assertionCount > 0 ? metrics.snapshotCount / metrics.assertionCount : 0;
  let assertionClarity: number;
  if (weakRatio < 0.1 && snapshotRatio < 0.1) assertionClarity = 5;
  else if (weakRatio < 0.2 && snapshotRatio < 0.2) assertionClarity = 4;
  else if (weakRatio < 0.3 && snapshotRatio < 0.3) assertionClarity = 3;
  else if (weakRatio < 0.5) assertionClarity = 2;
  else assertionClarity = 1;

  // Isolation (1-5): Fewer isolation issues = higher score
  const isolationIssueCount = metrics.isolationIssues.length;
  let isolation: number;
  if (isolationIssueCount === 0) isolation = 5;
  else if (isolationIssueCount === 1) isolation = 3;
  else isolation = 1;

  // Overall: weighted average
  const overall = mockFidelity * 0.3 + implementationCoupling * 0.25 + assertionClarity * 0.25 + isolation * 0.2;

  return {
    mockFidelity,
    implementationCoupling,
    assertionClarity,
    isolation,
    overall: Math.round(overall * 10) / 10,
  };
}

function extractPackageName(filePath: string, rootDir: string): string {
  const relativePath = relative(rootDir, filePath);
  const parts = relativePath.split("/");

  // Handle packages/* structure
  if (parts[0] === "packages" && parts.length > 1) {
    return `@acme/${parts[1]}`;
  }

  // Handle apps/* structure
  if (parts[0] === "apps" && parts.length > 1) {
    return `@apps/${parts[1]}`;
  }

  // Handle test/* structure
  if (parts[0] === "test") {
    return "test";
  }

  // Handle scripts/* structure
  if (parts[0] === "scripts") {
    return "scripts";
  }

  return "root";
}

// ============================================================================
// File Discovery
// ============================================================================

function findTestFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    // Skip node_modules, dist, coverage, etc.
    if (
      entry === "node_modules" ||
      entry === "dist" ||
      entry === "coverage" ||
      entry === ".next" ||
      entry === ".turbo" ||
      entry === "out"
    ) {
      continue;
    }

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findTestFiles(fullPath, files);
    } else if (stat.isFile() && /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================================================
// Package Analysis
// ============================================================================

function analyzePackage(packagePath: string, rootDir: string): PackageAnalysis | null {
  const testFiles = findTestFiles(packagePath);

  if (testFiles.length === 0) {
    return null;
  }

  const analyses = testFiles.map((f) => analyzeTestFile(f, rootDir));
  const packageName = extractPackageName(packagePath, rootDir);

  // Calculate summary
  const totalTests = analyses.reduce((sum, a) => sum + a.metrics.testCount, 0);
  const totalAssertions = analyses.reduce((sum, a) => sum + a.metrics.assertionCount, 0);
  const totalMocks = analyses.reduce((sum, a) => sum + a.metrics.mockCount + a.metrics.spyOnCount, 0);

  const avgScores = {
    mockFidelity: average(analyses.map((a) => a.scores.mockFidelity)),
    implementationCoupling: average(analyses.map((a) => a.scores.implementationCoupling)),
    assertionClarity: average(analyses.map((a) => a.scores.assertionClarity)),
    isolation: average(analyses.map((a) => a.scores.isolation)),
    overall: average(analyses.map((a) => a.scores.overall)),
  };

  const flaggedFiles = analyses.filter((a) => a.flags.length > 0).length;

  // Identify critical issues
  const criticalIssues: string[] = [];
  if (avgScores.overall < 3) {
    criticalIssues.push(`Low overall quality score: ${avgScores.overall.toFixed(1)}`);
  }
  if (avgScores.mockFidelity < 3) {
    criticalIssues.push(`Heavy mocking: avg ${avgScores.mockFidelity.toFixed(1)}/5`);
  }
  if (avgScores.implementationCoupling < 4) {
    criticalIssues.push(`Implementation coupling detected`);
  }

  return {
    name: packageName,
    path: packagePath,
    testFiles: analyses,
    summary: {
      totalTests,
      totalAssertions,
      totalMocks,
      averageScores: avgScores,
      flaggedFiles,
      criticalIssues,
    },
  };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(packages: PackageAnalysis[]): AuditReport {
  const allFiles = packages.flatMap((p) => p.testFiles);

  const overallScores = {
    mockFidelity: average(allFiles.map((f) => f.scores.mockFidelity)),
    implementationCoupling: average(allFiles.map((f) => f.scores.implementationCoupling)),
    assertionClarity: average(allFiles.map((f) => f.scores.assertionClarity)),
    isolation: average(allFiles.map((f) => f.scores.isolation)),
    overall: average(allFiles.map((f) => f.scores.overall)),
  };

  // Collect top issues
  const topIssues: AuditReport["topIssues"] = [];

  for (const file of allFiles) {
    if (file.scores.overall < 2.5) {
      topIssues.push({
        file: file.relativePath,
        issue: `Very low quality score: ${file.scores.overall}`,
        severity: "high",
      });
    }
    if (file.metrics.mockCount > 7) {
      topIssues.push({
        file: file.relativePath,
        issue: `Excessive mocking: ${file.metrics.mockCount} mocks`,
        severity: "high",
      });
    }
    if (file.metrics.implementationCouplingPatterns.length > 1) {
      topIssues.push({
        file: file.relativePath,
        issue: `Implementation coupling: ${file.metrics.implementationCouplingPatterns.join(", ")}`,
        severity: "medium",
      });
    }
    if (file.metrics.isolationIssues.length > 0) {
      topIssues.push({
        file: file.relativePath,
        issue: `Isolation issues: ${file.metrics.isolationIssues.join(", ")}`,
        severity: "medium",
      });
    }
  }

  // Sort by severity
  topIssues.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    generatedAt: new Date().toISOString(),
    packagesAnalyzed: packages.length,
    totalTestFiles: allFiles.length,
    packages,
    overallScores,
    topIssues: topIssues.slice(0, 50), // Top 50 issues
  };
}

function printSummary(report: AuditReport): void {
  console.log("\n" + "=".repeat(70));
  console.log("TEST QUALITY AUDIT REPORT");
  console.log("=".repeat(70));
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Packages analyzed: ${report.packagesAnalyzed}`);
  console.log(`Total test files: ${report.totalTestFiles}`);

  console.log("\n" + "-".repeat(70));
  console.log("OVERALL SCORES (1-5 scale, higher is better)");
  console.log("-".repeat(70));
  console.log(`  Mock Fidelity:          ${report.overallScores.mockFidelity.toFixed(1)} / 5`);
  console.log(`  Implementation Coupling: ${report.overallScores.implementationCoupling.toFixed(1)} / 5`);
  console.log(`  Assertion Clarity:      ${report.overallScores.assertionClarity.toFixed(1)} / 5`);
  console.log(`  Test Isolation:         ${report.overallScores.isolation.toFixed(1)} / 5`);
  console.log(`  OVERALL:                ${report.overallScores.overall.toFixed(1)} / 5`);

  console.log("\n" + "-".repeat(70));
  console.log("PACKAGE BREAKDOWN");
  console.log("-".repeat(70));

  const sortedPackages = [...report.packages].sort((a, b) => a.summary.averageScores.overall - b.summary.averageScores.overall);

  for (const pkg of sortedPackages) {
    const score = pkg.summary.averageScores.overall.toFixed(1);
    const flag = pkg.summary.criticalIssues.length > 0 ? " ⚠️" : "";
    console.log(`  ${pkg.name.padEnd(30)} ${score}/5  (${pkg.testFiles.length} files)${flag}`);
  }

  if (report.topIssues.length > 0) {
    console.log("\n" + "-".repeat(70));
    console.log("TOP ISSUES (showing first 15)");
    console.log("-".repeat(70));

    for (const issue of report.topIssues.slice(0, 15)) {
      const severity = issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "🟢";
      console.log(`  ${severity} ${issue.file}`);
      console.log(`     ${issue.issue}`);
    }
  }

  console.log("\n" + "=".repeat(70));
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const filter = args[0];
  const rootDir = process.cwd();

  console.log("Analyzing test quality...\n");

  // Determine which directories to scan
  let dirsToScan: string[];

  if (filter) {
    // Filter by package name or path
    if (filter.startsWith("@acme/")) {
      const pkgName = filter.replace("@acme/", "");
      dirsToScan = [join(rootDir, "packages", pkgName)];
    } else if (filter.startsWith("@apps/")) {
      const appName = filter.replace("@apps/", "");
      dirsToScan = [join(rootDir, "apps", appName)];
    } else if (filter.startsWith("packages/") || filter.startsWith("apps/")) {
      dirsToScan = [join(rootDir, filter)];
    } else {
      // Try as package name
      dirsToScan = [join(rootDir, "packages", filter)];
    }
  } else {
    // Scan all packages and apps
    dirsToScan = [];

    // Add all packages
    const packagesDir = join(rootDir, "packages");
    if (existsSync(packagesDir)) {
      for (const pkg of readdirSync(packagesDir)) {
        const pkgPath = join(packagesDir, pkg);
        if (statSync(pkgPath).isDirectory()) {
          dirsToScan.push(pkgPath);
        }
      }
    }

    // Add all apps
    const appsDir = join(rootDir, "apps");
    if (existsSync(appsDir)) {
      for (const app of readdirSync(appsDir)) {
        const appPath = join(appsDir, app);
        if (statSync(appPath).isDirectory()) {
          dirsToScan.push(appPath);
        }
      }
    }

    // Add test directory
    const testDir = join(rootDir, "test");
    if (existsSync(testDir)) {
      dirsToScan.push(testDir);
    }

    // Add scripts directory
    const scriptsDir = join(rootDir, "scripts");
    if (existsSync(scriptsDir)) {
      dirsToScan.push(scriptsDir);
    }
  }

  // Analyze each directory
  const packageAnalyses: PackageAnalysis[] = [];

  for (const dir of dirsToScan) {
    if (!existsSync(dir)) {
      console.warn(`Warning: Directory not found: ${dir}`);
      continue;
    }

    const analysis = analyzePackage(dir, rootDir);
    if (analysis) {
      packageAnalyses.push(analysis);
      console.log(`  Analyzed ${analysis.name}: ${analysis.testFiles.length} test files`);
    }
  }

  if (packageAnalyses.length === 0) {
    console.log("No test files found.");
    process.exit(0);
  }

  // Generate report
  const report = generateReport(packageAnalyses);

  // Print summary to console
  printSummary(report);

  // Write full report to file
  const reportPath = join(rootDir, "test-audit-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report written to: ${reportPath}`);
}

main();
