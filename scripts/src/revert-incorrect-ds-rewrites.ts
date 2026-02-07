#!/usr/bin/env node
/**
 * Revert incorrect @acme/design-system rewrites back to @acme/ui
 *
 * The import rewrite script incorrectly rewrote @acme/ui/atoms → @acme/design-system/atoms
 * but these are DIFFERENT sets of atoms. @acme/ui/atoms has domain-specific atoms like
 * Button, Badge, Card, etc. while @acme/design-system/atoms has generic atoms like
 * Alert, Avatar, Chip, etc.
 *
 * This script reverts those incorrect rewrites.
 */

import * as path from "path";
import { Project } from "ts-morph";

// Components that DON'T exist in design-system/atoms (should stay in @acme/ui/atoms)
const UI_ONLY_ATOMS = new Set([
  "Badge",
  "Button",
  "Card",
  "CfCardImage",
  "CfHeroImage",
  "CfImage",
  "CfResponsiveImage",
  "FacilityIcon",
  "Grid",
  "IconButton",
  "Link",
  "RatingsBar",
  "RoomImage",
  "Section",
  "Spinner",
  "TableHeader",
  "Typography",
  "VisuallyHidden",
  // Also check for types that may be imported
  "Input",
  "Textarea",
  "Label",
  "Select",
  "Checkbox",
  "DropdownMenu",
  "Dialog",
  "Sheet",
  "Tabs",
  "Separator",
  "ScrollArea",
]);

// Components that DON'T exist in design-system/molecules (should stay in @acme/ui)
const UI_ONLY_MOLECULES = new Set([
  "AccordionItem",
  "BenefitCard",
  "CartItem",
  "CategoryCard",
  "CollectionCard",
  "ContactCard",
  "ContentBlock",
  "DealCard",
  "FeatureCard",
  "ImageGallery",
  "NavItem",
  "OrderCard",
  "ProductCard",
  "ProductTile",
  "PromoCard",
  "QuickViewCard",
  "ReviewCard",
  "RoomCard",
  "ServiceCard",
  "SocialLink",
  "Stepper",
  "TeamMember",
  "TestimonialCard",
  "Timeline",
]);

interface RevertResult {
  filePath: string;
  changes: Array<{
    original: string;
    reverted: string;
    line: number;
  }>;
}

function shouldRevertAtomImport(importPath: string): string | null {
  // Check if it's @acme/design-system/atoms or @acme/design-system/atoms/Something
  const atomsMatch = importPath.match(/^@acme\/design-system\/atoms(?:\/(.+))?$/);
  if (!atomsMatch) return null;

  const component = atomsMatch[1];

  // If it's the barrel import (@acme/design-system/atoms), we can't easily determine
  // what's imported, so we'll need to check the actual import statement
  // For now, skip barrel imports
  if (!component) return null;

  // If the component is in UI_ONLY_ATOMS, revert to @acme/ui/atoms/Component
  if (UI_ONLY_ATOMS.has(component)) {
    return `@acme/ui/atoms/${component}`;
  }

  return null;
}

function shouldRevertMoleculeImport(importPath: string): string | null {
  const moleculesMatch = importPath.match(/^@acme\/design-system\/molecules(?:\/(.+))?$/);
  if (!moleculesMatch) return null;

  const component = moleculesMatch[1];
  if (!component) return null;

  if (UI_ONLY_MOLECULES.has(component)) {
    return `@acme/ui/molecules/${component}`;
  }

  return null;
}

function shouldRevertShadcnImport(importPath: string): string | null {
  // shadcn components should be imported from @acme/ui/components/atoms/shadcn
  // or from @acme/design-system/shadcn (if they were moved)
  // Check if we need to revert
  const shadcnMatch = importPath.match(/^@acme\/design-system\/shadcn(?:\/(.+))?$/);
  if (!shadcnMatch) return null;

  // For now, don't revert shadcn imports - they should be in design-system
  return null;
}

function getRevertedPath(importPath: string): string | null {
  return (
    shouldRevertAtomImport(importPath) ||
    shouldRevertMoleculeImport(importPath) ||
    shouldRevertShadcnImport(importPath)
  );
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

  console.log(`\n🔄 Revert Incorrect Design-System Rewrites${dryRun ? " (dry run)" : ""}\n`);

  const project = new Project({
    tsConfigFilePath: path.join(repoRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  // Add all TypeScript files
  project.addSourceFilesAtPaths([
    `${repoRoot}/apps/**/src/**/*.{ts,tsx}`,
    `${repoRoot}/packages/**/src/**/*.{ts,tsx}`,
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
    console.log("\n✅ Changes reverted successfully");
  } else {
    console.log("\n✅ No changes needed");
  }
}

main().catch(console.error);
