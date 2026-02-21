/**
 * DS lint regression guard (TASK-11)
 *
 * Ensures DS lint rules remain active for Prime app and no blanket
 * bypass is re-introduced. Guards the work done in TASK-01 through TASK-10.
 *
 * Validation contract:
 * - TC-01: Guard test passes with DS rules active
 * - TC-02: Guard test would fail if blanket bypass re-introduced
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '../../../../..');
const ESLINT_CONFIG_PATH = resolve(REPO_ROOT, 'eslint.config.mjs');

/** Read eslint.config.mjs content once for all tests */
const eslintConfig = readFileSync(ESLINT_CONFIG_PATH, 'utf8');

/**
 * Extract config blocks that target Prime files.
 *
 * Strategy: find `files: [...]` arrays containing "apps/prime", then extract
 * the text between that block's opening `{` and its closing `}` by tracking
 * brace depth. This handles nested objects (e.g., rule options) correctly.
 */
function extractPrimeConfigBlocks(configText: string) {
  const blocks: Array<{ filesLine: string; blockText: string }> = [];

  // Find all files arrays containing apps/prime
  const filesRegex = /files:\s*\[([^\]]+)\]/g;
  let match;
  while ((match = filesRegex.exec(configText)) !== null) {
    const filesLine = match[1];
    if (!filesLine.includes('apps/prime')) continue;

    // Walk backward from `files:` to find the opening `{` of this block
    let blockStart = match.index;
    while (blockStart > 0 && configText[blockStart] !== '{') blockStart--;

    // Walk forward from blockStart tracking brace depth
    let depth = 0;
    let blockEnd = blockStart;
    for (let i = blockStart; i < configText.length; i++) {
      if (configText[i] === '{') depth++;
      if (configText[i] === '}') depth--;
      if (depth === 0) {
        blockEnd = i + 1;
        break;
      }
    }

    blocks.push({ filesLine, blockText: configText.slice(blockStart, blockEnd) });
  }

  return blocks;
}

describe('TASK-11: DS lint regression guard', () => {
  it('TC-01a: eslint.config.mjs exists and is readable', () => {
    expect(eslintConfig.length).toBeGreaterThan(0);
    expect(eslintConfig).toContain('dsPlugin');
  });

  it('TC-01b: no blanket offAllDsRules bypass for apps/prime/**', () => {
    const primeBlocks = extractPrimeConfigBlocks(eslintConfig);

    for (const block of primeBlocks) {
      // A blanket bypass is: files includes "apps/prime/**" AND rules spread ...offAllDsRules
      // Scoped exceptions (e.g., "apps/prime/src/components/dev/**") are allowed
      const isBlanketPrimeScope =
        block.filesLine.includes('"apps/prime/**"') ||
        block.filesLine.includes("'apps/prime/**'");

      if (isBlanketPrimeScope) {
        expect(block.blockText).not.toContain('...offAllDsRules');
      }
    }
  });

  it('TC-01c: DS color rules are not "off" for apps/prime/**', () => {
    const colorRules = [
      'ds/no-raw-color',
      'ds/no-raw-tailwind-color',
      'ds/no-raw-font',
    ];

    const primeBlocks = extractPrimeConfigBlocks(eslintConfig);
    const blanketBlocks = primeBlocks.filter(
      (b) =>
        b.filesLine.includes('"apps/prime/**"') ||
        b.filesLine.includes("'apps/prime/**'"),
    );

    for (const block of blanketBlocks) {
      for (const rule of colorRules) {
        // Color rules should not be turned off in any blanket Prime block
        const offForms = [
          `'${rule}': 'off'`,
          `'${rule}': "off"`,
          `"${rule}": 'off'`,
          `"${rule}": "off"`,
        ];
        expect(offForms.some((form) => block.blockText.includes(form))).toBe(false);
      }
    }
  });

  it('TC-01d: offAllDsRules definition still exists (used by other apps)', () => {
    // Verify the utility exists — it's used by non-Prime apps
    expect(eslintConfig).toMatch(/const\s+offAllDsRules\s*=/);
  });

  it('TC-01e: Prime blanket block preserves DS justification ticket pattern', () => {
    const primeBlocks = extractPrimeConfigBlocks(eslintConfig);
    const blanketBlock = primeBlocks.find(
      (b) =>
        b.filesLine.includes('"apps/prime/**"') ||
        b.filesLine.includes("'apps/prime/**'"),
    );

    expect(blanketBlock).toBeDefined();
    expect(blanketBlock?.blockText).toContain('ds/require-disable-justification');
    expect(blanketBlock?.blockText).toContain('ticketPattern');
    expect(blanketBlock?.blockText).not.toContain('...offAllDsRules');
  });

  it('TC-02: guard would detect blanket bypass if re-introduced', () => {
    // Simulate what the config would look like with a blanket bypass
    const configWithBypass = eslintConfig + `
  {
    files: ["apps/prime/**"],
    rules: {
      ...offAllDsRules,
    },
  },
`;

    const primeBlocks = extractPrimeConfigBlocks(configWithBypass);
    const blanketBlocks = primeBlocks.filter(
      (b) =>
        b.filesLine.includes('"apps/prime/**"') ||
        b.filesLine.includes("'apps/prime/**'"),
    );

    // At least one block should contain offAllDsRules — proving the guard catches it
    const hasBypass = blanketBlocks.some((b) =>
      b.blockText.includes('...offAllDsRules'),
    );
    expect(hasBypass).toBe(true);
  });
});
