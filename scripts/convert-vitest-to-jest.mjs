#!/usr/bin/env node
/**
 * Convert Vitest test files to Jest syntax.
 */

import * as fs from "fs";
import * as path from "path";
import pkg from "glob";
const { glob } = pkg;

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

function convertFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const changes = [];
  let newContent = content;

  // Track if we need to add @testing-library/jest-dom import
  let needsJestDomImport = false;
  let hasJestDomImport = newContent.includes('@testing-library/jest-dom"') ||
                          newContent.includes("@testing-library/jest-dom'");

  // Remove vitest eslint env comment
  if (newContent.includes("/* eslint-env vitest */")) {
    newContent = newContent.replace(/\/\* eslint-env vitest \*\/\n?/g, "");
    changes.push("Removed /* eslint-env vitest */ comment");
  }

  // Replace @testing-library/jest-dom/vitest with @testing-library/jest-dom
  if (newContent.includes('@testing-library/jest-dom/vitest"') ||
      newContent.includes("@testing-library/jest-dom/vitest'")) {
    newContent = newContent.replace(
      /import\s+["']@testing-library\/jest-dom\/vitest["'];?\n?/g,
      'import "@testing-library/jest-dom";\n'
    );
    changes.push("Replaced @testing-library/jest-dom/vitest with @testing-library/jest-dom");
    hasJestDomImport = true;
  }

  // Remove vitest imports - capture what was imported to know if we need jest-dom
  const vitestImportMatch = newContent.match(/import\s+\{([^}]+)\}\s+from\s+["']vitest["'];?\n?/);
  if (vitestImportMatch) {
    const imports = vitestImportMatch[1];
    // Check if expect was imported (means we might need jest-dom matchers)
    if (imports.includes("expect") && !hasJestDomImport) {
      needsJestDomImport = true;
    }
    newContent = newContent.replace(
      /import\s+\{[^}]+\}\s+from\s+["']vitest["'];?\n?/g,
      ""
    );
    changes.push("Removed vitest import");
  }

  // Add jest-dom import if needed and not already present
  if (needsJestDomImport && !hasJestDomImport) {
    // Add after the first import or at the beginning
    const firstImportMatch = newContent.match(/^import\s+/m);
    if (firstImportMatch && firstImportMatch.index !== undefined) {
      newContent = newContent.slice(0, firstImportMatch.index) +
                   'import "@testing-library/jest-dom";\n' +
                   newContent.slice(firstImportMatch.index);
      changes.push("Added @testing-library/jest-dom import");
    }
  }

  // Replace ReturnType<typeof vi.fn> with jest.Mock
  if (newContent.includes("ReturnType<typeof vi.fn>")) {
    newContent = newContent.replace(/ReturnType<typeof vi\.fn>/g, "jest.Mock");
    changes.push("Replaced ReturnType<typeof vi.fn> with jest.Mock");
  }

  // Replace ReturnType<typeof vi.spyOn> with jest.SpyInstance
  if (newContent.includes("ReturnType<typeof vi.spyOn>")) {
    newContent = newContent.replace(/ReturnType<typeof vi\.spyOn>/g, "jest.SpyInstance");
    changes.push("Replaced ReturnType<typeof vi.spyOn> with jest.SpyInstance");
  }

  // Remove vi.hoisted wrapper - Jest hoists mocks automatically
  // Pattern: vi.hoisted(() => { ... }) or vi.hoisted(() => ...)
  if (newContent.includes("vi.hoisted")) {
    // Handle vi.hoisted(() => { const x = ...; return { ... }; })
    // Transform to just the inner declarations without the wrapper
    newContent = newContent.replace(
      /vi\.hoisted\(\s*\(\)\s*=>\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*\)/g,
      (match, inner) => {
        // Extract the return statement content if present
        const returnMatch = inner.match(/return\s+(\{[^}]*\}|\([^)]*\)|[^;]+);/);
        if (returnMatch) {
          // Remove the return and just keep the declarations
          const withoutReturn = inner.replace(/return\s+[^;]+;/, "").trim();
          return withoutReturn;
        }
        return inner.trim();
      }
    );
    // Handle simpler vi.hoisted(() => value)
    newContent = newContent.replace(
      /vi\.hoisted\(\s*\(\)\s*=>\s*([^)]+)\)/g,
      "$1"
    );
    changes.push("Removed vi.hoisted wrapper (Jest hoists mocks automatically)");
  }

  // Replace vi.importActual with jest.requireActual (async version)
  if (newContent.includes("vi.importActual")) {
    // Handle: await vi.importActual<T>("module")
    newContent = newContent.replace(
      /await\s+vi\.importActual(<[^>]+>)?\s*\(/g,
      "jest.requireActual("
    );
    // Handle remaining vi.importActual (without await - less common)
    newContent = newContent.replace(/vi\.importActual/g, "jest.requireActual");
    changes.push("Replaced vi.importActual with jest.requireActual");
  }

  // Replace vi.* with jest.*
  const viReplacements = [
    [/\bvi\.mock\(/g, "jest.mock(", "vi.mock"],
    [/\bvi\.fn\(/g, "jest.fn(", "vi.fn"],
    [/\bvi\.fn\b(?!\()/g, "jest.fn", "vi.fn (without parens)"],
    [/\bvi\.spyOn\(/g, "jest.spyOn(", "vi.spyOn"],
    [/\bvi\.clearAllMocks\(/g, "jest.clearAllMocks(", "vi.clearAllMocks"],
    [/\bvi\.resetAllMocks\(/g, "jest.resetAllMocks(", "vi.resetAllMocks"],
    [/\bvi\.restoreAllMocks\(/g, "jest.restoreAllMocks(", "vi.restoreAllMocks"],
    [/\bvi\.mocked\(/g, "jest.mocked(", "vi.mocked"],
    [/\bvi\.useFakeTimers\(/g, "jest.useFakeTimers(", "vi.useFakeTimers"],
    [/\bvi\.useRealTimers\(/g, "jest.useRealTimers(", "vi.useRealTimers"],
    [/\bvi\.advanceTimersByTime\(/g, "jest.advanceTimersByTime(", "vi.advanceTimersByTime"],
    [/\bvi\.runAllTimers\(/g, "jest.runAllTimers(", "vi.runAllTimers"],
    [/\bvi\.runOnlyPendingTimers\(/g, "jest.runOnlyPendingTimers(", "vi.runOnlyPendingTimers"],
    [/\bvi\.setSystemTime\(/g, "jest.setSystemTime(", "vi.setSystemTime"],
    [/\bvi\.getRealSystemTime\(/g, "jest.getRealSystemTime(", "vi.getRealSystemTime"],
    [/\bvi\.resetModules\(/g, "jest.resetModules(", "vi.resetModules"],
    [/\bvi\.doMock\(/g, "jest.doMock(", "vi.doMock"],
    [/\bvi\.doUnmock\(/g, "jest.doUnmock(", "vi.doUnmock"],
    [/\bvi\.waitFor\(/g, "/* vi.waitFor - use waitFor from @testing-library/react instead */ (", "vi.waitFor"],
  ];

  for (const [pattern, replacement, name] of viReplacements) {
    // Reset lastIndex for global regex before testing
    pattern.lastIndex = 0;
    if (pattern.test(newContent)) {
      // Reset lastIndex again before replacing
      pattern.lastIndex = 0;
      newContent = newContent.replace(pattern, replacement);
      changes.push("Replaced " + name + " with jest equivalent");
    }
  }

  // Also replace vi references in comments mentioning Vitest
  if (newContent.includes("Vitest hoists")) {
    newContent = newContent.replace(/Vitest hoists `vi\.mock`/g, "Jest hoists `jest.mock`");
    newContent = newContent.replace(/Vitest hoists vi\.mock/g, "Jest hoists jest.mock");
    changes.push("Updated Vitest comments");
  }

  // Check for remaining vi. references (excluding comments)
  // Remove single-line comments and check what's left
  const contentWithoutComments = newContent
    .replace(/\/\/.*$/gm, "")  // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "");  // Remove multi-line comments
  const remainingViMatch = contentWithoutComments.match(/\bvi\.\w+/g);
  if (remainingViMatch) {
    const unique = [...new Set(remainingViMatch)];
    changes.push("WARNING: Remaining vi.* references in code: " + unique.join(", "));
  }

  const changed = content !== newContent;

  if (changed && !DRY_RUN) {
    fs.writeFileSync(filePath, newContent, "utf-8");
  }

  return { file: filePath, changed, changes };
}

async function main() {
  console.log("Converting Vitest tests to Jest...\n");

  if (DRY_RUN) {
    console.log("DRY RUN - no files will be modified\n");
  }

  // Find all test files
  const testFiles = glob.sync("**/*.test.{ts,tsx}", {
    ignore: ["node_modules/**", "**/node_modules/**", "dist/**", ".next/**"],
    cwd: process.cwd(),
  });

  console.log("Found " + testFiles.length + " test files total\n");

  // Filter to only files that contain vitest syntax
  const vitestFiles = [];
  for (const file of testFiles) {
    const content = fs.readFileSync(file, "utf-8");
    if (content.includes('from "vitest"') ||
        content.includes("from 'vitest'") ||
        content.includes("vi.mock") ||
        content.includes("vi.fn") ||
        content.includes("@testing-library/jest-dom/vitest")) {
      vitestFiles.push(file);
    }
  }

  console.log("Found " + vitestFiles.length + " files with Vitest syntax\n");

  const results = [];
  let changedCount = 0;
  let warningCount = 0;

  for (const file of vitestFiles) {
    const result = convertFile(file);
    results.push(result);

    if (result.changed) {
      changedCount++;
      const hasWarning = result.changes.some(c => c.startsWith("WARNING"));
      if (VERBOSE || hasWarning) {
        console.log("\n" + result.file + ":");
        for (const change of result.changes) {
          const prefix = change.startsWith("WARNING") ? "  ! " : "  > ";
          console.log(prefix + change);
          if (change.startsWith("WARNING")) warningCount++;
        }
      } else {
        process.stdout.write(".");
      }
    }
  }

  console.log("\n");
  console.log("============================================================");
  console.log("Conversion complete!");
  console.log("  Files converted: " + changedCount);
  console.log("  Warnings: " + warningCount);
  if (DRY_RUN) {
    console.log("\nThis was a dry run. Run without --dry-run to apply changes.");
  }

  // Print files with warnings
  const filesWithWarnings = results.filter(r =>
    r.changes.some(c => c.startsWith("WARNING"))
  );
  if (filesWithWarnings.length > 0) {
    console.log("\nFiles with warnings (may need manual review):");
    for (const result of filesWithWarnings) {
      console.log("  - " + result.file);
      for (const change of result.changes.filter(c => c.startsWith("WARNING"))) {
        console.log("      " + change);
      }
    }
  }
}

main().catch(console.error);
