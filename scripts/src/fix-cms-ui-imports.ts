#!/usr/bin/env node
/**
 * Fix cms-ui imports that point to non-existent local paths.
 * These should point to @acme/ui instead (files haven't been moved yet).
 *
 * Usage:
 *   pnpm tsx scripts/src/fix-cms-ui-imports.ts --dry-run
 *   pnpm tsx scripts/src/fix-cms-ui-imports.ts
 */

import * as path from "path";
import { Project, type StringLiteral,SyntaxKind } from "ts-morph";

interface FixMapping {
  /** Pattern to match */
  pattern: RegExp;
  /** Replacement path */
  replacement: string;
}

// Fix mappings for broken relative imports in cms-ui.
// These imports reference paths that don't exist in cms-ui (e.g., ../../atoms)
// because the code was moved from @acme/ui but imports weren't updated.
const FIX_MAPPINGS: FixMapping[] = [
  // === ATOMS barrel imports -> @acme/design-system/atoms ===
  { pattern: /^(?:\.\.\/)+atoms$/, replacement: "@acme/design-system/atoms" },

  // === ATOMS/shadcn -> @acme/design-system/shadcn ===
  { pattern: /^(?:\.\.\/)+atoms\/shadcn$/, replacement: "@acme/design-system/shadcn" },
  { pattern: /^(?:\.\.\/)+atoms\/shadcn\/(.+)$/, replacement: "@acme/design-system/shadcn/$1" },
  { pattern: /^(?:\.\.\/)+components\/atoms\/shadcn$/, replacement: "@acme/design-system/shadcn" },

  // === ATOMS/primitives -> @acme/design-system/primitives ===
  { pattern: /^(?:\.\.\/)+atoms\/primitives$/, replacement: "@acme/design-system/primitives" },
  { pattern: /^(?:\.\.\/)+atoms\/primitives\/(.+)$/, replacement: "@acme/design-system/primitives/$1" },
  { pattern: /^(?:\.\.\/)+components\/atoms\/primitives$/, replacement: "@acme/design-system/primitives" },
  { pattern: /^(?:\.\.\/)+components\/atoms\/primitives\/(.+)$/, replacement: "@acme/design-system/primitives/$1" },

  // === ATOMS specific components -> @acme/design-system/atoms/* ===
  { pattern: /^(?:\.\.\/)+atoms\/(.+)$/, replacement: "@acme/design-system/atoms/$1" },
  { pattern: /^(?:\.\.\/)+components\/atoms$/, replacement: "@acme/design-system/atoms" },
  { pattern: /^(?:\.\.\/)+components\/atoms\/(.+)$/, replacement: "@acme/design-system/atoms/$1" },

  // === ORGANISMS -> @acme/ui/components/organisms ===
  // Note: organisms are at components/organisms/, not organisms/
  { pattern: /^(?:\.\.\/)+organisms$/, replacement: "@acme/ui/components/organisms" },
  { pattern: /^(?:\.\.\/)+organisms\/(.+)$/, replacement: "@acme/ui/components/organisms/$1" },
  { pattern: /^(?:\.\.\/)+components\/organisms$/, replacement: "@acme/ui/components/organisms" },
  { pattern: /^(?:\.\.\/)+components\/organisms\/(.+)$/, replacement: "@acme/ui/components/organisms/$1" },

  // Fix already-rewritten @acme/ui/organisms -> @acme/ui/components/organisms
  { pattern: /^@acme\/ui\/organisms\/(.+)$/, replacement: "@acme/ui/components/organisms/$1" },
  { pattern: /^@acme\/ui\/organisms$/, replacement: "@acme/ui/components/organisms" },

  // === MOLECULES -> @acme/design-system/molecules ===
  { pattern: /^(?:\.\.\/)+molecules$/, replacement: "@acme/design-system/molecules" },
  { pattern: /^(?:\.\.\/)+molecules\/(.+)$/, replacement: "@acme/design-system/molecules/$1" },
  { pattern: /^(?:\.\.\/)+components\/molecules$/, replacement: "@acme/design-system/molecules" },
  { pattern: /^(?:\.\.\/)+components\/molecules\/(.+)$/, replacement: "@acme/design-system/molecules/$1" },

  // === HOME components -> @acme/ui/home ===
  { pattern: /^(?:\.\.\/)+home\/(.+)$/, replacement: "@acme/ui/home/$1" },
  { pattern: /^(?:\.\.\/)+components\/home\/(.+)$/, replacement: "@acme/ui/home/$1" },

  // === TEMPLATES -> @acme/ui/templates ===
  { pattern: /^(?:\.\.\/)+templates\/(.+)$/, replacement: "@acme/ui/templates/$1" },
  { pattern: /^(?:\.\.\/)+components\/templates\/(.+)$/, replacement: "@acme/ui/templates/$1" },

  // === CHECKOUT -> @acme/ui/checkout ===
  { pattern: /^(?:\.\.\/)+checkout\/(.+)$/, replacement: "@acme/ui/checkout/$1" },
  { pattern: /^(?:\.\.\/)+components\/checkout\/(.+)$/, replacement: "@acme/ui/checkout/$1" },

  // === AB testing -> @acme/ui/ab ===
  { pattern: /^(?:\.\.\/)+ab\/(.+)$/, replacement: "@acme/ui/ab/$1" },

  // === Utils/style -> @acme/design-system/utils/style ===
  { pattern: /^(?:\.\.\/)+utils\/style$/, replacement: "@acme/design-system/utils/style" },
  { pattern: /^(?:\.\.\/)+utils\/style\/(.+)$/, replacement: "@acme/design-system/utils/style/$1" },

  // === Utils (devicePresets, colorUtils) -> @acme/ui/utils ===
  { pattern: /^(?:\.\.\/)+utils\/devicePresets$/, replacement: "@acme/ui/utils/devicePresets" },
  { pattern: /^(?:\.\.\/)+utils\/colorUtils$/, replacement: "@acme/ui/utils/colorUtils" },

  // === Story utils -> @acme/ui/story-utils ===
  { pattern: /^(?:\.\.\/)+story-utils\/(.+)$/, replacement: "@acme/ui/story-utils/$1" },

  // === Hooks (relative) -> @acme/ui/components/cms/page-builder/hooks ===
  { pattern: /^(?:\.\.\/)+hooks\/(.+)$/, replacement: "@acme/ui/components/cms/page-builder/hooks/$1" },

  // === Fix already-rewritten @acme/ui/hooks/* -> @acme/ui/components/cms/page-builder/hooks/* ===
  // (page-builder hooks were incorrectly mapped to @acme/ui/hooks/)
  { pattern: /^@acme\/ui\/hooks\/(useLocalStrings|useCenterInParent|usePageBuilderDnD|useGroupingActions|useGlobals|usePreviewTokens|useDimLockedSelection|useRulerProps|useSelectionGrouping|useSelectionPositions|useDropHighlight|useLibraryActions|useInsertHandlers|useKeyboardShortcuts|usePageBuilderSave|usePublishWithValidation|useToastState|useStyleClipboardActions)$/, replacement: "@acme/ui/components/cms/page-builder/hooks/$1" },

  // === AB testing -> @acme/ui/components/ab ===
  { pattern: /^@acme\/ui\/ab\/(.+)$/, replacement: "@acme/ui/components/ab/$1" },
  { pattern: /^(?:\.\.\/)+ab\/(.+)$/, replacement: "@acme/ui/components/ab/$1" },

  // === Checkout -> @acme/ui/components/checkout ===
  { pattern: /^@acme\/ui\/checkout\/(.+)$/, replacement: "@acme/ui/components/checkout/$1" },
  { pattern: /^(?:\.\.\/)+checkout\/(.+)$/, replacement: "@acme/ui/components/checkout/$1" },

  // === Templates -> @acme/ui/components/templates ===
  { pattern: /^@acme\/ui\/templates\/(.+)$/, replacement: "@acme/ui/components/templates/$1" },
  { pattern: /^(?:\.\.\/)+templates\/(.+)$/, replacement: "@acme/ui/components/templates/$1" },

  // === CMS components still in @acme/ui/components/cms/ ===
  { pattern: /^\.\/LocaleContentAccordion$/, replacement: "@acme/ui/components/cms/LocaleContentAccordion" },
  { pattern: /^\.\.\/LocaleContentAccordion$/, replacement: "@acme/ui/components/cms/LocaleContentAccordion" },
  { pattern: /^\.\.\/ColorInput$/, replacement: "@acme/ui/components/cms/ColorInput" },
  { pattern: /^\.\.\/FontSelect$/, replacement: "@acme/ui/components/cms/FontSelect" },
  { pattern: /^\.\.\/RangeInput$/, replacement: "@acme/ui/components/cms/RangeInput" },
  { pattern: /^\.\.\/MediaFileList$/, replacement: "@acme/ui/components/cms/MediaFileList" },
  { pattern: /^\.\.\/ProductFilters$/, replacement: "@acme/ui/components/cms/ProductFilters" },
];

interface FixResult {
  filePath: string;
  changes: Array<{
    original: string;
    fixed: string;
    line: number;
  }>;
}

function fixImportPath(importPath: string): string | null {
  for (const mapping of FIX_MAPPINGS) {
    if (mapping.pattern.test(importPath)) {
      // Use replace to handle capture groups ($1, $2, etc.)
      return importPath.replace(mapping.pattern, mapping.replacement);
    }
  }
  return null;
}

function processStringLiteral(
  stringLiteral: StringLiteral,
  dryRun: boolean
): { original: string; fixed: string; line: number } | null {
  const importPath = stringLiteral.getLiteralValue();
  const fixed = fixImportPath(importPath);

  if (!fixed) {
    return null;
  }

  const line = stringLiteral.getStartLineNumber();

  if (!dryRun) {
    stringLiteral.setLiteralValue(fixed);
  }

  return {
    original: importPath,
    fixed,
    line,
  };
}

function processFile(
  project: Project,
  filePath: string,
  dryRun: boolean
): FixResult | null {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    return null;
  }

  const changes: FixResult["changes"] = [];

  // Process import declarations
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifier();
    const result = processStringLiteral(moduleSpecifier, dryRun);
    if (result) {
      changes.push(result);
    }
  }

  // Process export declarations
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifier();
    if (moduleSpecifier) {
      const result = processStringLiteral(moduleSpecifier, dryRun);
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

    const isImport = expression.getKind() === SyntaxKind.ImportKeyword;
    const isRequire = expression.getText() === "require";
    const exprText = expression.getText();
    const isMockCall = ["mock", "doMock", "unmock", "requireActual", "requireMock"].some(
      (m) => exprText === `jest.${m}` || exprText === `vi.${m}`
    );

    if ((isImport || isRequire || isMockCall) && args.length > 0) {
      const firstArg = args[0];
      if (firstArg && firstArg.getKind() === SyntaxKind.StringLiteral) {
        const result = processStringLiteral(firstArg as StringLiteral, dryRun);
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

  console.log(`\n🔧 Fix cms-ui imports${dryRun ? " (dry run)" : ""}\n`);

  const project = new Project({
    tsConfigFilePath: path.join(repoRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  const cmsUiSrcPath = path.join(repoRoot, "packages/cms-ui/src");

  // Add all TypeScript files in cms-ui
  project.addSourceFilesAtPaths([
    `${cmsUiSrcPath}/**/*.ts`,
    `${cmsUiSrcPath}/**/*.tsx`,
  ]);

  const sourceFiles = project.getSourceFiles();
  const results: FixResult[] = [];

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
      console.log(`    L${change.line}: ${change.original} → ${change.fixed}`);
    }
    totalChanges += result.changes.length;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Files modified: ${results.length}`);
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
