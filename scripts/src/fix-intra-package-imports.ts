#!/usr/bin/env node
/**
 * Fix Intra-Package Imports
 *
 * Reverts incorrectly rewritten intra-package imports back to relative imports.
 * For example, within packages/cms-ui/src, imports like "@acme/cms-ui/Foo"
 * should be "./Foo" instead.
 *
 * Usage:
 *   pnpm tsx scripts/src/fix-intra-package-imports.ts --dry-run
 *   pnpm tsx scripts/src/fix-intra-package-imports.ts
 */

import * as path from "path";
import { Project, type SourceFile, type StringLiteral,SyntaxKind } from "ts-morph";

// Package configurations
const PACKAGES_TO_FIX = [
  {
    packagePath: "packages/cms-ui/src",
    packageName: "@acme/cms-ui",
  },
  {
    packagePath: "packages/ui/src",
    packageName: "@acme/ui",
  },
];

interface FixResult {
  filePath: string;
  changes: Array<{
    original: string;
    fixed: string;
    line: number;
  }>;
}

function computeRelativePath(fromFile: string, toModule: string, packageSrcPath: string): string {
  // Get the directory of the importing file relative to package src
  const fromDir = path.dirname(fromFile);

  // The target path within the package
  const targetPath = path.join(packageSrcPath, toModule);

  // Compute relative path
  let relativePath = path.relative(fromDir, targetPath);

  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }

  // Normalize path separators for cross-platform
  relativePath = relativePath.replace(/\\/g, "/");

  return relativePath;
}

function processStringLiteral(
  stringLiteral: StringLiteral,
  filePath: string,
  packageConfig: typeof PACKAGES_TO_FIX[0],
  dryRun: boolean,
  repoRoot: string
): { original: string; fixed: string; line: number } | null {
  const importPath = stringLiteral.getLiteralValue();

  // Check if it's an intra-package import (e.g., @acme/cms-ui/Foo within packages/cms-ui/src)
  const prefix = packageConfig.packageName + "/";
  if (!importPath.startsWith(prefix)) {
    return null;
  }

  // Extract the module path after the package name
  const modulePath = importPath.slice(prefix.length);

  // Compute the relative path
  const packageSrcPath = path.join(repoRoot, packageConfig.packagePath);
  const relativePath = computeRelativePath(filePath, modulePath, packageSrcPath);

  const line = stringLiteral.getStartLineNumber();

  if (!dryRun) {
    stringLiteral.setLiteralValue(relativePath);
  }

  return {
    original: importPath,
    fixed: relativePath,
    line,
  };
}

function processFile(
  project: Project,
  filePath: string,
  packageConfig: typeof PACKAGES_TO_FIX[0],
  dryRun: boolean,
  repoRoot: string
): FixResult | null {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    return null;
  }

  const changes: FixResult["changes"] = [];

  // Process import declarations
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifier();
    const result = processStringLiteral(
      moduleSpecifier,
      filePath,
      packageConfig,
      dryRun,
      repoRoot
    );
    if (result) {
      changes.push(result);
    }
  }

  // Process export declarations
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifier();
    if (moduleSpecifier) {
      const result = processStringLiteral(
        moduleSpecifier,
        filePath,
        packageConfig,
        dryRun,
        repoRoot
      );
      if (result) {
        changes.push(result);
      }
    }
  }

  // Process dynamic imports and require calls
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    const args = callExpr.getArguments();

    // Check for import() or require()
    const isImport = expression.getKind() === SyntaxKind.ImportKeyword;
    const isRequire = expression.getText() === "require";

    if ((isImport || isRequire) && args.length > 0) {
      const firstArg = args[0];
      if (firstArg && firstArg.getKind() === SyntaxKind.StringLiteral) {
        const result = processStringLiteral(
          firstArg as StringLiteral,
          filePath,
          packageConfig,
          dryRun,
          repoRoot
        );
        if (result) {
          changes.push(result);
        }
      }
    }

    // Check for jest.mock, vi.mock, etc.
    const exprText = expression.getText();
    const mockMethods = ["mock", "doMock", "unmock", "requireActual", "requireMock"];
    const isMockCall = mockMethods.some(
      (m) => exprText === `jest.${m}` || exprText === `vi.${m}`
    );

    if (isMockCall && args.length > 0) {
      const firstArg = args[0];
      if (firstArg && firstArg.getKind() === SyntaxKind.StringLiteral) {
        const result = processStringLiteral(
          firstArg as StringLiteral,
          filePath,
          packageConfig,
          dryRun,
          repoRoot
        );
        if (result) {
          changes.push(result);
        }
      }
    }
  }

  if (changes.length === 0) {
    return null;
  }

  if (!dryRun) {
    sourceFile.saveSync();
  }

  return { filePath, changes };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const repoRoot = process.cwd();

  console.log(`\n🔧 Fix Intra-Package Imports${dryRun ? " (dry run)" : ""}\n`);

  const project = new Project({
    tsConfigFilePath: path.join(repoRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  let totalChanges = 0;
  let totalFiles = 0;

  for (const packageConfig of PACKAGES_TO_FIX) {
    const packageSrcPath = path.join(repoRoot, packageConfig.packagePath);
    console.log(`\nProcessing ${packageConfig.packageName}...`);

    // Add all TypeScript files in the package
    project.addSourceFilesAtPaths([
      `${packageSrcPath}/**/*.ts`,
      `${packageSrcPath}/**/*.tsx`,
    ]);

    const sourceFiles = project.getSourceFiles().filter((sf: SourceFile) =>
      sf.getFilePath().includes(packageConfig.packagePath)
    );

    const results: FixResult[] = [];

    for (const sourceFile of sourceFiles) {
      const result = processFile(
        project,
        sourceFile.getFilePath(),
        packageConfig,
        dryRun,
        repoRoot
      );
      if (result) {
        results.push(result);
      }
    }

    // Print results
    for (const result of results) {
      const relPath = path.relative(repoRoot, result.filePath);
      console.log(`\n  ${relPath}:`);
      for (const change of result.changes) {
        console.log(`    L${change.line}: ${change.original} → ${change.fixed}`);
      }
      totalChanges += result.changes.length;
    }

    totalFiles += results.length;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Files modified: ${totalFiles}`);
  console.log(`Total changes:  ${totalChanges}`);

  if (dryRun) {
    console.log("\n⚠️  Dry run - no files were modified");
  } else if (totalChanges > 0) {
    console.log("\n✅ Changes applied successfully");
  } else {
    console.log("\n✅ No changes needed");
  }
}

main().catch(console.error);
