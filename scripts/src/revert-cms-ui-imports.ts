#!/usr/bin/env node
/**
 * Revert @acme/cms-ui imports back to @acme/ui
 *
 * The import rewrite script prematurely changed @acme/ui/components/cms/...
 * imports to @acme/cms-ui/... but the components haven't been moved yet.
 *
 * This script reverts those imports back to @acme/ui.
 */

import * as path from "path";
import { Project, SyntaxKind } from "ts-morph";

interface RevertResult {
  filePath: string;
  changes: Array<{
    original: string;
    reverted: string;
    line: number;
  }>;
}

/**
 * Maps @acme/cms-ui imports back to @acme/ui imports
 */
function getRevertedPath(importPath: string): string | null {
  // @acme/cms-ui → @acme/ui/components/cms
  if (importPath === "@acme/cms-ui") {
    return "@acme/ui/components/cms";
  }

  // @acme/cms-ui/hooks/useTokenEditor → @acme/ui/hooks/useTokenEditor
  if (importPath.startsWith("@acme/cms-ui/hooks/")) {
    return importPath.replace("@acme/cms-ui/hooks/", "@acme/ui/hooks/");
  }

  // @acme/cms-ui/style/presets.json → @acme/ui/components/cms/style/presets.json
  if (importPath.startsWith("@acme/cms-ui/style/")) {
    return importPath.replace("@acme/cms-ui/style/", "@acme/ui/components/cms/style/");
  }

  // @acme/cms-ui/ComponentName → @acme/ui/components/cms/ComponentName
  if (importPath.startsWith("@acme/cms-ui/")) {
    const componentPath = importPath.replace("@acme/cms-ui/", "");
    return `@acme/ui/components/cms/${componentPath}`;
  }

  return null;
}

function processFile(
  project: Project,
  filePath: string,
  dryRun: boolean
): RevertResult | null {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) return null;

  const changes: RevertResult["changes"] = [];

  // Process import declarations
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifier();
    const importPath = moduleSpecifier.getLiteralValue();
    const reverted = getRevertedPath(importPath);

    if (reverted) {
      changes.push({
        original: importPath,
        reverted,
        line: moduleSpecifier.getStartLineNumber(),
      });

      if (!dryRun) {
        moduleSpecifier.setLiteralValue(reverted);
      }
    }
  }

  // Process export declarations
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifier();
    if (!moduleSpecifier) continue;

    const importPath = moduleSpecifier.getLiteralValue();
    const reverted = getRevertedPath(importPath);

    if (reverted) {
      changes.push({
        original: importPath,
        reverted,
        line: moduleSpecifier.getStartLineNumber(),
      });

      if (!dryRun) {
        moduleSpecifier.setLiteralValue(reverted);
      }
    }
  }

  // Process dynamic imports
  for (const callExpr of sourceFile.getDescendantsOfKind(
    SyntaxKind.StringLiteral
  )) {
    const parent = callExpr.getParent();
    if (!parent) continue;

    // Check if this is inside an import() call
    const grandParent = parent.getParent();
    if (grandParent && grandParent.getKindName() === "CallExpression") {
      const callText = grandParent.getText();
      if (callText.startsWith("import(")) {
        const importPath = callExpr.getLiteralValue();
        const reverted = getRevertedPath(importPath);

        if (reverted) {
          changes.push({
            original: importPath,
            reverted,
            line: callExpr.getStartLineNumber(),
          });

          if (!dryRun) {
            callExpr.setLiteralValue(reverted);
          }
        }
      }
    }
  }

  if (changes.length === 0) return null;

  if (!dryRun) {
    sourceFile.saveSync();
  }

  return { filePath, changes };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const repoRoot = process.cwd();

  console.log(`\n🔄 Revert @acme/cms-ui imports back to @acme/ui${dryRun ? " (dry run)" : ""}\n`);

  const project = new Project({
    tsConfigFilePath: path.join(repoRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  // Add all TypeScript files in apps/
  project.addSourceFilesAtPaths([
    `${repoRoot}/apps/**/src/**/*.{ts,tsx}`,
    `${repoRoot}/apps/**/__tests__/**/*.{ts,tsx}`,
  ]);

  const sourceFiles = project.getSourceFiles();
  const results: RevertResult[] = [];

  console.log(`Scanning ${sourceFiles.length} files...`);

  for (const sourceFile of sourceFiles) {
    const result = processFile(project, sourceFile.getFilePath(), dryRun);
    if (result) {
      results.push(result);
    }
  }

  // Print results
  let totalChanges = 0;
  for (const result of results) {
    const relPath = path.relative(repoRoot, result.filePath);
    console.log(`\n  ${relPath}:`);
    for (const change of result.changes) {
      console.log(`    L${change.line}: ${change.original} → ${change.reverted}`);
    }
    totalChanges += result.changes.length;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Files modified: ${results.length}`);
  console.log(`Total changes:  ${totalChanges}`);

  if (dryRun) {
    console.log("\n⚠️  Dry run - no files were modified");
  } else if (totalChanges > 0) {
    console.log("\n✅ Imports reverted successfully");
  } else {
    console.log("\n✅ No changes needed");
  }
}

main().catch(console.error);
