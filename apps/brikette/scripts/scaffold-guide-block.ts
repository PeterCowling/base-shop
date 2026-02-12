#!/usr/bin/env tsx
/**
 * Scaffolding script for generating new guide block handlers.
 *
 * Usage:
 *   pnpm scaffold-guide-block weatherForecast
 *
 * This script generates:
 * - Handler file at src/routes/guides/blocks/handlers/{blockName}Block.tsx
 * - Test file at src/routes/guides/blocks/__tests__/{blockName}Block.test.tsx
 * - Manual insertion snippets for types.ts and composeBlocks.tsx
 *
 * Does NOT modify existing files (too risky for auto-generation).
 */

import { mkdir, readdir,writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// Validation: check if name is camelCase
function isCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
}

// Convert camelCase to PascalCase
function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Check if block already exists
async function blockExists(blockName: string): Promise<boolean> {
  try {
    const handlersDir = join(PROJECT_ROOT, "src/routes/guides/blocks/handlers");
    const files = await readdir(handlersDir);
    return files.some((file) => file === `${blockName}Block.tsx`);
  } catch {
    return false;
  }
}

// Generate handler file content
function generateHandlerContent(blockName: string): string {
  const pascalName = toPascalCase(blockName);

  return `/**
 * ${pascalName} block handler.
 *
 * TODO: Add description of what this block does.
 */

import type { ${pascalName}BlockOptions } from "../types";

import type { BlockAccumulator } from "./BlockAccumulator";

export function apply${pascalName}Block(acc: BlockAccumulator, options: ${pascalName}BlockOptions): void {
  // TODO: Implement block logic
  // Common patterns:
  // - Use acc.addSlot("article", (context) => { ... }) to add content to the article
  // - Use acc.mergeTemplate({ ... }) to update template props
  // - Use acc.warn("message") to log warnings
  // - Use context.translateGuides(key) to resolve i18n strings

  acc.warn(\`${pascalName} block not yet implemented\`);
}
`;
}

// Generate test file content
function generateTestContent(blockName: string): string {
  const pascalName = toPascalCase(blockName);

  return `/**
 * Tests for ${pascalName} block handler.
 *
 * Verifies that ${blockName} blocks render correctly.
 */

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import { BlockAccumulator } from "@/routes/guides/blocks/handlers/BlockAccumulator";
import { apply${pascalName}Block } from "@/routes/guides/blocks/handlers/${blockName}Block";
import type { ${pascalName}BlockOptions } from "@/routes/guides/blocks/types";
import type { GuideManifestEntry } from "@/routes/guides/guide-manifest";
import type { GuideSeoTemplateContext } from "@/routes/guides/guide-seo/types";

// Mock translate function
const mockTranslateGuides = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    // TODO: Add mock translations
    "content.testGuide.${blockName}.example": "Example text",
  };
  return translations[key] ?? key;
});

describe("${blockName} block handler", () => {
  let mockContext: GuideSeoTemplateContext;
  let mockManifest: GuideManifestEntry;

  beforeEach(() => {
    jest.clearAllMocks();

    mockManifest = {
      guideKey: "testGuide",
      areas: ["experiences"],
      blocks: [],
      relatedGuides: [],
      contentKey: "testGuide",
    } as GuideManifestEntry;

    mockContext = {
      guideKey: "testGuide",
      translateGuides: mockTranslateGuides,
      lang: "en",
    } as GuideSeoTemplateContext;
  });

  it("renders basic ${blockName} block", () => {
    // TODO: Implement test
    const options: ${pascalName}BlockOptions = {
      // TODO: Add required options
    };

    const acc = new BlockAccumulator(mockManifest);
    apply${pascalName}Block(acc, options);
    const template = acc.buildTemplate();

    // TODO: Add assertions
    expect(template).toBeDefined();
  });

  // TODO: Add more test cases
});
`;
}

// Generate manual insertion snippets
function generateSnippets(blockName: string): string {
  const pascalName = toPascalCase(blockName);

  return `
================================================================================
SCAFFOLDING COMPLETE
================================================================================

Generated files:
  ✓ src/routes/guides/blocks/handlers/${blockName}Block.tsx
  ✓ src/routes/guides/blocks/__tests__/${blockName}Block.test.tsx

MANUAL STEPS REQUIRED:
--------------------------------------------------------------------------------

1. ADD TO BLOCK TYPE UNION in packages/guide-system/src/block-types.ts:

   a) Add to GUIDE_BLOCK_TYPES array (line ~14):
      "${blockName}",

   b) Add Zod schema (after existing schemas, before type exports):
      const ${blockName}BlockOptionsSchema = z
        .object({
          // TODO: Define your block's options schema
          // Example:
          // titleKey: z.string().min(1).optional(),
          // bodyKey: z.string().min(1),
        })
        .strict();

   c) Add TypeScript type (in the type exports section, ~line 191):
      export type ${pascalName}BlockOptions = z.infer<typeof ${blockName}BlockOptionsSchema>;

   d) Add block interface type (~line 206):
      export type ${pascalName}Block = { type: "${blockName}"; options: ${pascalName}BlockOptions };

   e) Add to GuideBlockDeclaration union (~line 221):
      | ${pascalName}Block

   f) Add to discriminated union schema (~line 237):
      z.object({ type: z.literal("${blockName}"), options: ${blockName}BlockOptionsSchema }),

2. EXPORT HANDLER in src/routes/guides/blocks/handlers/index.ts:

   Add this line (in alphabetical order):
      export { apply${pascalName}Block } from "./${blockName}Block";

3. REGISTER IN COMPOSER in src/routes/guides/blocks/composeBlocks.tsx:

   a) Import the handler (line ~13):
      import { apply${pascalName}Block } from "./handlers/${blockName}Block";

   b) Add case to composeBlock switch (~line 76):
      case "${blockName}":
        apply${pascalName}Block(acc, block.options);
        return;

4. IMPLEMENT THE HANDLER:
   - Edit src/routes/guides/blocks/handlers/${blockName}Block.tsx
   - Follow patterns from existing handlers (calloutBlock, tableBlock, etc.)
   - Common patterns:
     • acc.addSlot("article", (context) => JSX) - add content to article
     • acc.mergeTemplate({ prop: value }) - update template props
     • context.translateGuides(key) - resolve i18n strings
     • acc.warn("message") - log validation warnings

5. WRITE TESTS:
   - Edit src/routes/guides/blocks/__tests__/${blockName}Block.test.tsx
   - Follow patterns from existing tests (callout-block.test.tsx)
   - Test rendering, i18n, edge cases

6. REBUILD GUIDE-SYSTEM PACKAGE:
   From repo root:
      pnpm --filter @acme/guide-system build

7. RUN TESTS:
   From brikette:
      pnpm test ${blockName}Block

================================================================================
`;
}

// Main script logic
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.info(`
Usage: pnpm scaffold-guide-block <blockName>

Generate handler and test stubs for a new guide block type.

Arguments:
  blockName    Name in camelCase (e.g., weatherForecast)

Example:
  pnpm scaffold-guide-block weatherForecast

The script will generate:
  - Handler: src/routes/guides/blocks/handlers/<blockName>Block.tsx
  - Test: src/routes/guides/blocks/__tests__/<blockName>Block.test.tsx
  - Manual insertion snippets for types.ts and composeBlocks.tsx
`);
    process.exit(0);
  }

  const blockName = args[0];

  // Validate name is camelCase
  if (!isCamelCase(blockName)) {
    console.error(`❌ Error: Block name must be camelCase (e.g., weatherForecast)`);
    console.error(`   Got: ${blockName}`);
    process.exit(1);
  }

  // Check for duplicates
  if (await blockExists(blockName)) {
    console.error(`❌ Error: Block "${blockName}" already exists`);
    console.error(`   File: src/routes/guides/blocks/handlers/${blockName}Block.tsx`);
    process.exit(1);
  }

  try {
    // Ensure directories exist
    const handlersDir = join(PROJECT_ROOT, "src/routes/guides/blocks/handlers");
    const testsDir = join(PROJECT_ROOT, "src/routes/guides/blocks/__tests__");

    await mkdir(handlersDir, { recursive: true });
    await mkdir(testsDir, { recursive: true });

    // Generate handler file
    const handlerPath = join(handlersDir, `${blockName}Block.tsx`);
    const handlerContent = generateHandlerContent(blockName);
    await writeFile(handlerPath, handlerContent, "utf-8");

    // Generate test file
    const testPath = join(testsDir, `${blockName}Block.test.tsx`);
    const testContent = generateTestContent(blockName);
    await writeFile(testPath, testContent, "utf-8");

    // Print snippets
    console.info(generateSnippets(blockName));

  } catch (error) {
    console.error(`❌ Error generating files:`, error);
    process.exit(1);
  }
}

main();
