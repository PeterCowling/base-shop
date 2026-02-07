#!/usr/bin/env node
/**
 * UI Package Import Rewriter
 *
 * Rewrites imports from deprecated @acme/ui paths to canonical paths in
 * @acme/design-system or @acme/cms-ui.
 *
 * Usage:
 *   pnpm tsx scripts/src/rewrite-ui-imports.ts --dry-run
 *   pnpm tsx scripts/src/rewrite-ui-imports.ts --target apps/cms
 *   pnpm tsx scripts/src/rewrite-ui-imports.ts --check  # CI mode: exit 1 if changes needed
 *   pnpm tsx scripts/src/rewrite-ui-imports.ts
 *
 * Part of UI-16: Import rewrite script for UI package split
 * See: docs/plans/ui-package-split-plan.md
 */

import * as fs from "fs";
import * as path from "path";
import { type CallExpression,Project, type SourceFile, type StringLiteral, SyntaxKind } from "ts-morph";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface ImportMapping {
  /** Pattern to match (supports wildcards via regex) */
  from: RegExp;
  /** Replacement function or string */
  to: string | ((match: RegExpExecArray) => string);
  /** Description for logging */
  description: string;
}

/**
 * Paths that should remain in @acme/ui (not be rewritten).
 * These are domain-specific modules that are NOT moving to design-system or cms-ui.
 */
const PATHS_STAYING_IN_UI = [
  // Main barrel
  /^@acme\/ui$/,

  // Component layers that stay in @acme/ui (domain-specific)
  /^@acme\/ui\/organisms/,
  /^@acme\/ui\/components\/organisms/,
  /^@acme\/ui\/templates/,
  /^@acme\/ui\/components\/templates/,
  /^@acme\/ui\/layout/,
  /^@acme\/ui\/components\/layout/,
  /^@acme\/ui\/home/,
  /^@acme\/ui\/components\/home/,
  /^@acme\/ui\/components\/platform/,
  /^@acme\/ui\/components\/checkout/,
  /^@acme\/ui\/components\/account/,
  /^@acme\/ui\/components\/ab/,
  /^@acme\/ui\/components\/upload/,
  /^@acme\/ui\/components\/common/,
  /^@acme\/ui\/components\/ThemeStyle/,
  /^@acme\/ui\/components\/DynamicRenderer/,
  /^@acme\/ui\/components\/ComponentPreview/,
  /^@acme\/ui\/components\/DeviceSelector/,
  /^@acme\/ui\/components$/,

  // Context and providers
  /^@acme\/ui\/context/,
  /^@acme\/ui\/providers/,

  // Domain modules
  /^@acme\/ui\/operations/,
  /^@acme\/ui\/account/,
  /^@acme\/ui\/shared/,
  /^@acme\/ui\/server/,

  // Config and data (domain-specific)
  /^@acme\/ui\/config/,
  /^@acme\/ui\/data/,
  /^@acme\/ui\/locales/,
  /^@acme\/ui\/i18n\.config/,

  // Types (stay in @acme/ui)
  /^@acme\/ui\/types/,

  // Lib utilities (domain-specific)
  /^@acme\/ui\/lib/,

  // Utils that stay in @acme/ui (domain-specific, not pure presentation)
  /^@acme\/ui\/utils\/devicePresets/,
  /^@acme\/ui\/utils\/colorUtils/,
  /^@acme\/ui\/utils\/translate-path/,
  /^@acme\/ui\/utils\/dateUtils/,
  /^@acme\/ui\/utils\/slug/,
  /^@acme\/ui\/utils\/buildNavLinks/,
  /^@acme\/ui\/utils\/lang/,
  /^@acme\/ui\/utils\/parseAmaKeywords/,
  /^@acme\/ui\/utils\/bookingDateFormat/,
  /^@acme\/ui\/utils\/buildProductFormData/,
  /^@acme\/ui\/utils\/formatDisplayDate/,

  // Hooks barrel (generic)
  /^@acme\/ui\/hooks$/,

  // Domain-specific hooks that stay in @acme/ui
  /^@acme\/ui\/hooks\/useCart/,
  /^@acme\/ui\/hooks\/useCurrentLanguage/,
  /^@acme\/ui\/hooks\/useTheme/,
  /^@acme\/ui\/hooks\/useRoomPricing/,
  /^@acme\/ui\/hooks\/useMediaUpload/,
  /^@acme\/ui\/hooks\/useFileUpload/,
  /^@acme\/ui\/hooks\/useImageOrientationValidation/,
  /^@acme\/ui\/hooks\/useProductInputs/,
  /^@acme\/ui\/hooks\/useProductFilters/,
  /^@acme\/ui\/hooks\/useContrastWarnings/,
  /^@acme\/ui\/hooks\/useRemoteImageProbe/,
  /^@acme\/ui\/hooks\/useResponsiveImage/,
  /^@acme\/ui\/hooks\/tryon/,
];

/**
 * Directories to exclude from processing (shims should not be rewritten)
 */
const EXCLUDED_PATHS = [
  /packages\/ui\/src\/shims\//,
  /packages\/ui\/src\/components\/atoms\/index\.ts$/, // shim file
  /packages\/ui\/src\/components\/atoms\/shadcn\/index\.ts$/, // shim file
  /packages\/ui\/src\/components\/molecules\/index\.ts$/, // shim file
  /packages\/cms-ui\/src\//, // Don't rewrite CMS hooks inside cms-ui (they use @acme/ui paths internally)
];

/**
 * Import mappings ordered by specificity (most specific first).
 * Order matters: first match wins.
 */
const IMPORT_MAPPINGS: ImportMapping[] = [
  // -------------------------------------------------------------------------
  // CMS UI mappings (Phase 3 - @acme/cms-ui)
  // -------------------------------------------------------------------------
  {
    from: /^@acme\/ui\/components\/cms\/page-builder\/(.+)$/,
    to: "@acme/cms-ui/page-builder/$1",
    description: "CMS page-builder components",
  },
  {
    from: /^@acme\/ui\/components\/cms\/blocks\/(.+)$/,
    to: "@acme/cms-ui/blocks/$1",
    description: "CMS block components",
  },
  {
    from: /^@acme\/ui\/components\/cms\/(.+)$/,
    to: "@acme/cms-ui/$1",
    description: "CMS components",
  },
  {
    from: /^@acme\/ui\/components\/cms$/,
    to: "@acme/cms-ui",
    description: "CMS barrel import",
  },
  {
    from: /^@acme\/ui\/hooks\/usePreviewDevice$/,
    to: "@acme/cms-ui/hooks/usePreviewDevice",
    description: "CMS hook: usePreviewDevice",
  },
  {
    from: /^@acme\/ui\/hooks\/useTokenEditor$/,
    to: "@acme/cms-ui/hooks/useTokenEditor",
    description: "CMS hook: useTokenEditor",
  },
  {
    from: /^@acme\/ui\/hooks\/useTokenColors$/,
    to: "@acme/cms-ui/hooks/useTokenColors",
    description: "CMS hook: useTokenColors",
  },

  // -------------------------------------------------------------------------
  // Design System mappings (Phase 2 - @acme/design-system)
  // -------------------------------------------------------------------------

  // Primitives (from nested atoms path)
  {
    from: /^@acme\/ui\/components\/atoms\/primitives\/(.+)$/,
    to: "@acme/design-system/primitives/$1",
    description: "Primitives from atoms path",
  },
  {
    from: /^@acme\/ui\/components\/atoms\/primitives$/,
    to: "@acme/design-system/primitives",
    description: "Primitives barrel from atoms path",
  },

  // shadcn (from nested atoms path)
  {
    from: /^@acme\/ui\/components\/atoms\/shadcn\/(.+)$/,
    to: "@acme/design-system/shadcn/$1",
    description: "shadcn from atoms path",
  },
  {
    from: /^@acme\/ui\/components\/atoms\/shadcn$/,
    to: "@acme/design-system/shadcn",
    description: "shadcn barrel from atoms path",
  },

  // Atoms (short path)
  {
    from: /^@acme\/ui\/atoms\/(.+)$/,
    to: "@acme/design-system/atoms/$1",
    description: "Atoms (short path)",
  },
  {
    from: /^@acme\/ui\/atoms$/,
    to: "@acme/design-system/atoms",
    description: "Atoms barrel (short path)",
  },

  // Atoms (components path)
  {
    from: /^@acme\/ui\/components\/atoms\/(.+)$/,
    to: "@acme/design-system/atoms/$1",
    description: "Atoms from components path",
  },
  {
    from: /^@acme\/ui\/components\/atoms$/,
    to: "@acme/design-system/atoms",
    description: "Atoms barrel from components path",
  },

  // Molecules (short path)
  {
    from: /^@acme\/ui\/molecules\/(.+)$/,
    to: "@acme/design-system/molecules/$1",
    description: "Molecules (short path)",
  },
  {
    from: /^@acme\/ui\/molecules$/,
    to: "@acme/design-system/molecules",
    description: "Molecules barrel (short path)",
  },

  // Molecules (components path)
  {
    from: /^@acme\/ui\/components\/molecules\/(.+)$/,
    to: "@acme/design-system/molecules/$1",
    description: "Molecules from components path",
  },
  {
    from: /^@acme\/ui\/components\/molecules$/,
    to: "@acme/design-system/molecules",
    description: "Molecules barrel from components path",
  },

  // Style utilities
  {
    from: /^@acme\/ui\/utils\/style\/(.+)$/,
    to: "@acme/design-system/utils/style/$1",
    description: "Style utilities",
  },
  {
    from: /^@acme\/ui\/utils\/style$/,
    to: "@acme/design-system/utils/style",
    description: "Style utilities barrel",
  },

  // Presentation hooks (moved to design-system)
  {
    from: /^@acme\/ui\/hooks\/useReducedMotion$/,
    to: "@acme/design-system/hooks/useReducedMotion",
    description: "Hook: useReducedMotion",
  },
  {
    from: /^@acme\/ui\/hooks\/useInView$/,
    to: "@acme/design-system/hooks/useInView",
    description: "Hook: useInView",
  },
  {
    from: /^@acme\/ui\/hooks\/useViewport$/,
    to: "@acme/design-system/hooks/useViewport",
    description: "Hook: useViewport",
  },
  {
    from: /^@acme\/ui\/hooks\/useScrollProgress$/,
    to: "@acme/design-system/hooks/useScrollProgress",
    description: "Hook: useScrollProgress",
  },
];

/**
 * Jest/Vitest methods that take module specifiers as first argument
 */
const MOCK_METHODS = new Set([
  "mock",
  "doMock",
  "unmock",
  "requireActual",
  "requireMock",
  "unstable_mockModule",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChangeType = "import" | "export" | "dynamic-import" | "type-import" | "require" | "jest-mock";

interface RewriteChange {
  original: string;
  rewritten: string;
  mapping: string;
  line: number;
  type: ChangeType;
}

interface RewriteResult {
  filePath: string;
  changes: RewriteChange[];
}

interface UnmatchedImport {
  filePath: string;
  importPath: string;
  line: number;
  type: string;
}

interface RewriteStats {
  filesScanned: number;
  filesModified: number;
  totalChanges: number;
  changesByMapping: Record<string, number>;
  changesByType: Record<string, number>;
  unmatchedImports: UnmatchedImport[];
}

// ---------------------------------------------------------------------------
// Core Logic
// ---------------------------------------------------------------------------

function isPathStayingInUi(importPath: string): boolean {
  return PATHS_STAYING_IN_UI.some((pattern) => pattern.test(importPath));
}

function isAcmeUiPath(importPath: string): boolean {
  return importPath.startsWith("@acme/ui");
}

function isExcludedFile(filePath: string): boolean {
  return EXCLUDED_PATHS.some((pattern) => pattern.test(filePath));
}

function rewriteImportPath(importPath: string): { newPath: string; mapping: string } | null {
  // Skip paths that should stay in @acme/ui
  if (isPathStayingInUi(importPath)) {
    return null;
  }

  for (const mapping of IMPORT_MAPPINGS) {
    const match = mapping.from.exec(importPath);
    if (match) {
      let newPath: string;
      if (typeof mapping.to === "function") {
        newPath = mapping.to(match);
      } else {
        // Replace $1, $2, etc. with capture groups
        newPath = mapping.to.replace(/\$(\d+)/g, (_, n) => match[parseInt(n, 10)] || "");
      }
      return { newPath, mapping: mapping.description };
    }
  }
  return null;
}

function processStringLiteral(
  stringLiteral: StringLiteral,
  type: ChangeType,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  const importPath = stringLiteral.getLiteralValue();

  // Check if it's an @acme/ui path
  if (!isAcmeUiPath(importPath)) {
    return;
  }

  const result = rewriteImportPath(importPath);

  if (result) {
    const line = stringLiteral.getStartLineNumber();
    changes.push({
      original: importPath,
      rewritten: result.newPath,
      mapping: result.mapping,
      line,
      type,
    });

    if (!dryRun) {
      stringLiteral.setLiteralValue(result.newPath);
    }
  } else if (!isPathStayingInUi(importPath)) {
    // Track unmatched @acme/ui paths that aren't explicitly staying
    unmatchedImports.push({
      filePath,
      importPath,
      line: stringLiteral.getStartLineNumber(),
      type,
    });
  }
}

function processFile(
  project: Project,
  filePath: string,
  dryRun: boolean,
  unmatchedImports: UnmatchedImport[]
): RewriteResult | null {
  // Skip excluded files (like shims)
  if (isExcludedFile(filePath)) {
    return null;
  }

  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    return null;
  }

  const changes: RewriteChange[] = [];

  // 1. Process import declarations
  processImportDeclarations(sourceFile, changes, unmatchedImports, filePath, dryRun);

  // 2. Process export declarations (re-exports)
  processExportDeclarations(sourceFile, changes, unmatchedImports, filePath, dryRun);

  // 3. Process type-only imports: import("...") in type positions
  // Must be before dynamic imports to avoid double-processing
  processTypeImports(sourceFile, changes, unmatchedImports, filePath, dryRun);

  // 4. Process all call expressions in a single pass (dynamic imports, require, jest.mock, etc.)
  processCallExpressions(sourceFile, changes, unmatchedImports, filePath, dryRun);

  if (changes.length === 0) {
    return null;
  }

  if (!dryRun) {
    sourceFile.saveSync();
  }

  return { filePath, changes };
}

function processImportDeclarations(
  sourceFile: SourceFile,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    if (!isAcmeUiPath(moduleSpecifier)) {
      continue;
    }

    const result = rewriteImportPath(moduleSpecifier);

    if (result) {
      const line = importDecl.getStartLineNumber();
      changes.push({
        original: moduleSpecifier,
        rewritten: result.newPath,
        mapping: result.mapping,
        line,
        type: "import",
      });

      if (!dryRun) {
        importDecl.setModuleSpecifier(result.newPath);
      }
    } else if (!isPathStayingInUi(moduleSpecifier)) {
      unmatchedImports.push({
        filePath,
        importPath: moduleSpecifier,
        line: importDecl.getStartLineNumber(),
        type: "import",
      });
    }
  }
}

function processExportDeclarations(
  sourceFile: SourceFile,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDecl of exportDeclarations) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue();
    if (!moduleSpecifier || !isAcmeUiPath(moduleSpecifier)) {
      continue;
    }

    const result = rewriteImportPath(moduleSpecifier);

    if (result) {
      const line = exportDecl.getStartLineNumber();
      changes.push({
        original: moduleSpecifier,
        rewritten: result.newPath,
        mapping: result.mapping,
        line,
        type: "export",
      });

      if (!dryRun) {
        exportDecl.setModuleSpecifier(result.newPath);
      }
    } else if (!isPathStayingInUi(moduleSpecifier)) {
      unmatchedImports.push({
        filePath,
        importPath: moduleSpecifier,
        line: exportDecl.getStartLineNumber(),
        type: "export",
      });
    }
  }
}

function processTypeImports(
  sourceFile: SourceFile,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  // Find import type nodes: import("@acme/ui/...").SomeType
  const importTypes = sourceFile.getDescendantsOfKind(SyntaxKind.ImportType);
  for (const importType of importTypes) {
    const argument = importType.getArgument();
    if (!argument) continue;

    // The argument could be a LiteralType wrapping a StringLiteral
    if (argument.getKind() === SyntaxKind.LiteralType) {
      const literalType = argument.asKind(SyntaxKind.LiteralType);
      if (literalType) {
        const literal = literalType.getLiteral();
        if (literal.getKind() === SyntaxKind.StringLiteral) {
          const stringLiteral = literal.asKind(SyntaxKind.StringLiteral);
          if (stringLiteral) {
            processStringLiteral(
              stringLiteral,
              "type-import",
              changes,
              unmatchedImports,
              filePath,
              dryRun
            );
          }
        }
      }
    }
  }
}

/**
 * Process all CallExpressions in a single pass for better performance.
 * Handles: dynamic import(), require(), jest.mock/doMock/requireActual/etc., vi.mock
 */
function processCallExpressions(
  sourceFile: SourceFile,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    const expressionKind = expression.getKind();

    // Dynamic import: import("...")
    if (expressionKind === SyntaxKind.ImportKeyword) {
      processDynamicImportCall(callExpr, changes, unmatchedImports, filePath, dryRun);
      continue;
    }

    // require("...")
    if (expressionKind === SyntaxKind.Identifier) {
      const identifier = expression.asKind(SyntaxKind.Identifier);
      if (identifier && identifier.getText() === "require") {
        processRequireCall(callExpr, changes, unmatchedImports, filePath, dryRun);
        continue;
      }
    }

    // jest.mock/doMock/requireActual/etc. or vi.mock
    if (expressionKind === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expression.asKind(SyntaxKind.PropertyAccessExpression);
      if (propAccess) {
        const objectText = propAccess.getExpression().getText();
        const methodName = propAccess.getName();

        if ((objectText === "jest" || objectText === "vi") && MOCK_METHODS.has(methodName)) {
          processJestMockCall(callExpr, changes, unmatchedImports, filePath, dryRun);
        }
      }
    }
  }
}

function processDynamicImportCall(
  callExpr: CallExpression,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  const args = callExpr.getArguments();
  if (args.length === 0) return;

  const arg = args[0];
  if (arg.getKind() === SyntaxKind.StringLiteral) {
    const stringLiteral = arg.asKind(SyntaxKind.StringLiteral);
    if (stringLiteral) {
      processStringLiteral(
        stringLiteral,
        "dynamic-import",
        changes,
        unmatchedImports,
        filePath,
        dryRun
      );
    }
  }
  // Note: Template literals not handled - would need special handling
}

function processRequireCall(
  callExpr: CallExpression,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  const args = callExpr.getArguments();
  if (args.length === 0) return;

  const arg = args[0];
  if (arg.getKind() === SyntaxKind.StringLiteral) {
    const stringLiteral = arg.asKind(SyntaxKind.StringLiteral);
    if (stringLiteral) {
      processStringLiteral(
        stringLiteral,
        "require",
        changes,
        unmatchedImports,
        filePath,
        dryRun
      );
    }
  }
}

function processJestMockCall(
  callExpr: CallExpression,
  changes: RewriteChange[],
  unmatchedImports: UnmatchedImport[],
  filePath: string,
  dryRun: boolean
): void {
  const args = callExpr.getArguments();
  if (args.length === 0) return;

  const arg = args[0];
  if (arg.getKind() === SyntaxKind.StringLiteral) {
    const stringLiteral = arg.asKind(SyntaxKind.StringLiteral);
    if (stringLiteral) {
      processStringLiteral(
        stringLiteral,
        "jest-mock",
        changes,
        unmatchedImports,
        filePath,
        dryRun
      );
    }
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`
UI Package Import Rewriter

Usage:
  pnpm tsx scripts/src/rewrite-ui-imports.ts [options]

Options:
  --dry-run       Show what would be changed without modifying files
  --check         CI mode: exit with code 1 if any changes would be made
  --target <dir>  Only process files in the specified directory
  --verbose       Show detailed output for each file
  --show-unmatched Show @acme/ui paths that weren't rewritten
  --help          Show this help message

Examples:
  pnpm tsx scripts/src/rewrite-ui-imports.ts --dry-run
  pnpm tsx scripts/src/rewrite-ui-imports.ts --check           # CI enforcement
  pnpm tsx scripts/src/rewrite-ui-imports.ts --target apps/cms
  pnpm tsx scripts/src/rewrite-ui-imports.ts --dry-run --show-unmatched
`);
}

function parseArgs(args: string[]): {
  dryRun: boolean;
  check: boolean;
  target: string | null;
  verbose: boolean;
  showUnmatched: boolean;
  help: boolean;
} {
  const result = {
    dryRun: false,
    check: false,
    target: null as string | null,
    verbose: false,
    showUnmatched: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--check") {
      result.check = true;
      result.dryRun = true; // --check implies --dry-run
    } else if (arg === "--target" && args[i + 1]) {
      result.target = args[++i];
    } else if (arg === "--verbose") {
      result.verbose = true;
    } else if (arg === "--show-unmatched") {
      result.showUnmatched = true;
    } else if (arg === "--help" || arg === "-h") {
      result.help = true;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const rootDir = process.cwd();
  const tsconfigPath = path.join(rootDir, "tsconfig.json");

  if (!fs.existsSync(tsconfigPath)) {
    console.error("Error: tsconfig.json not found. Run from monorepo root.");
    process.exit(1);
  }

  const modeLabel = args.check ? " (CHECK MODE)" : args.dryRun ? " (DRY RUN)" : "";
  console.log(`\n🔍 UI Import Rewriter${modeLabel}\n`);

  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: tsconfigPath,
    skipAddingFilesFromTsConfig: true,
  });

  // Determine which directories to scan (expanded to include more locations)
  const dirsToScan = args.target
    ? [path.resolve(rootDir, args.target)]
    : [
        path.join(rootDir, "apps"),
        path.join(rootDir, "packages"),
        path.join(rootDir, "scripts"),
        path.join(rootDir, "tools"),
        path.join(rootDir, "src"),
        path.join(rootDir, "functions"),
      ];

  // Find all TypeScript files
  const filePaths: string[] = [];
  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) {
      continue; // Silently skip non-existent directories
    }
    findTypeScriptFiles(dir, filePaths, args.verbose);
  }

  console.log(`📁 Found ${filePaths.length} TypeScript files to scan\n`);

  // Add files to project
  for (const filePath of filePaths) {
    project.addSourceFileAtPath(filePath);
  }

  // Process files with progress indicator
  const stats: RewriteStats = {
    filesScanned: filePaths.length,
    filesModified: 0,
    totalChanges: 0,
    changesByMapping: {},
    changesByType: {},
    unmatchedImports: [],
  };

  const results: RewriteResult[] = [];
  const progressInterval = Math.max(1, Math.floor(filePaths.length / 20)); // ~20 progress updates

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];

    // Progress indicator (only in non-verbose mode to avoid clutter)
    if (!args.verbose && i > 0 && i % progressInterval === 0) {
      const pct = Math.round((i / filePaths.length) * 100);
      process.stdout.write(`\r   Processing... ${pct}%`);
    }

    const result = processFile(project, filePath, args.dryRun, stats.unmatchedImports);
    if (result) {
      results.push(result);
      stats.filesModified++;
      stats.totalChanges += result.changes.length;

      for (const change of result.changes) {
        stats.changesByMapping[change.mapping] =
          (stats.changesByMapping[change.mapping] || 0) + 1;
        stats.changesByType[change.type] =
          (stats.changesByType[change.type] || 0) + 1;
      }
    }
  }

  // Clear progress line
  if (!args.verbose && filePaths.length > progressInterval) {
    process.stdout.write("\r" + " ".repeat(30) + "\r");
  }

  // Print results
  if (args.verbose || args.dryRun) {
    for (const result of results) {
      const relativePath = path.relative(rootDir, result.filePath);
      console.log(`\n📄 ${relativePath}`);
      for (const change of result.changes) {
        console.log(`   L${change.line} [${change.type}]: ${change.original}`);
        console.log(`       → ${change.rewritten}`);
        console.log(`       (${change.mapping})`);
      }
    }
  }

  // Print summary
  console.log("\n" + "─".repeat(60));
  console.log("📊 Summary\n");
  console.log(`   Files scanned:  ${stats.filesScanned}`);
  console.log(`   Files modified: ${stats.filesModified}`);
  console.log(`   Total changes:  ${stats.totalChanges}`);

  if (Object.keys(stats.changesByMapping).length > 0) {
    console.log("\n   Changes by mapping:");
    const sortedMappings = Object.entries(stats.changesByMapping).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [mapping, count] of sortedMappings) {
      console.log(`   - ${mapping}: ${count}`);
    }
  }

  if (Object.keys(stats.changesByType).length > 0) {
    console.log("\n   Changes by type:");
    const sortedTypes = Object.entries(stats.changesByType).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [type, count] of sortedTypes) {
      console.log(`   - ${type}: ${count}`);
    }
  }

  // Print unmatched imports (always show count, details with --show-unmatched)
  if (stats.unmatchedImports.length > 0) {
    console.log(`\n⚠️  Unmatched @acme/ui imports: ${stats.unmatchedImports.length}`);
    console.log("   (These paths don't match any mapping and aren't in the 'stay in ui' list)");

    if (args.showUnmatched) {
      // Group by import path for cleaner output
      const byPath = new Map<string, UnmatchedImport[]>();
      for (const imp of stats.unmatchedImports) {
        const existing = byPath.get(imp.importPath) || [];
        existing.push(imp);
        byPath.set(imp.importPath, existing);
      }

      console.log("\n   Unmatched paths:");
      const sortedPaths = [...byPath.entries()].sort((a, b) => b[1].length - a[1].length);
      for (const [importPath, occurrences] of sortedPaths) {
        console.log(`   - ${importPath} (${occurrences.length} occurrences)`);
        if (args.verbose) {
          for (const occ of occurrences.slice(0, 3)) {
            const relativePath = path.relative(rootDir, occ.filePath);
            console.log(`     └─ ${relativePath}:${occ.line} [${occ.type}]`);
          }
          if (occurrences.length > 3) {
            console.log(`     └─ ... and ${occurrences.length - 3} more`);
          }
        }
      }
    } else {
      console.log("   Run with --show-unmatched to see details");
    }
  }

  // Final status message and exit code
  if (args.check) {
    if (stats.totalChanges > 0) {
      console.log("\n❌ CHECK FAILED - imports need migration");
      console.log(`   Run 'pnpm tsx scripts/src/rewrite-ui-imports.ts' to apply changes\n`);
      process.exit(1);
    } else {
      console.log("\n✅ CHECK PASSED - all imports are canonical\n");
      process.exit(0);
    }
  } else if (args.dryRun) {
    console.log("\n⚠️  DRY RUN - no files were modified");
    console.log("   Run without --dry-run to apply changes\n");
  } else if (stats.filesModified > 0) {
    console.log("\n✅ Changes applied successfully\n");
  } else {
    console.log("\n✨ No changes needed\n");
  }

  process.exit(0);
}

function findTypeScriptFiles(dir: string, results: string[], verbose: boolean = false): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    if (verbose) {
      console.warn(`Warning: Could not read directory: ${dir}`);
    }
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip common non-source directories
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".next" ||
        entry.name === "coverage" ||
        entry.name === ".turbo" ||
        entry.name === ".git" ||
        entry.name === "out"
      ) {
        continue;
      }
      findTypeScriptFiles(fullPath, results, verbose);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") ||
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".mts") ||
        entry.name.endsWith(".cts")) &&
      !entry.name.endsWith(".d.ts")
    ) {
      results.push(fullPath);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
