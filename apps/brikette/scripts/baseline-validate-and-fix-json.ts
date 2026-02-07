#!/usr/bin/env tsx
/**
 * Baseline validation and fix for all locale JSON files
 *
 * Per improve-guide skill requirements:
 * - Validate all JSON files parse correctly
 * - For corrupted files, restore from git (known-good content)
 * - No manual patching or surgery on corrupted files
 * - Stop-the-line if restoration fails
 */

import * as fs from 'fs';
import { execSync } from 'child_process';
import glob from 'glob';

interface ValidationResult {
  valid: number;
  corrupted: number;
  restored: number;
  failed: string[];
}

function validateJson(filePath: string): { valid: boolean; error?: string } {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

function restoreFromGit(filePath: string): boolean {
  try {
    console.log(`  Restoring ${filePath} from git...`);
    execSync(`git restore "${filePath}"`, { stdio: 'pipe' });

    // Verify restoration worked
    const result = validateJson(filePath);
    if (result.valid) {
      console.log(`  ✓ Successfully restored and validated`);
      return true;
    } else {
      console.log(`  ✗ Restored file still invalid: ${result.error}`);
      return false;
    }
  } catch (e) {
    console.log(`  ✗ Git restore failed: ${(e as Error).message}`);
    return false;
  }
}

function main() {
  console.log('🔍 Baseline validation of all locale JSON files\n');
  console.log('=' .repeat(60));

  const pattern = 'src/locales/*/guides/content/*.json';
  const files = glob.sync(pattern, { cwd: process.cwd() });

  console.log(`Found ${files.length} files to validate\n`);

  const result: ValidationResult = {
    valid: 0,
    corrupted: 0,
    restored: 0,
    failed: []
  };

  // Phase 1: Identify all corrupted files
  const corrupted: Array<{ path: string; error: string }> = [];

  for (const file of files) {
    const validation = validateJson(file);
    if (validation.valid) {
      result.valid++;
    } else {
      result.corrupted++;
      corrupted.push({ path: file, error: validation.error! });
    }
  }

  console.log(`Phase 1: Validation complete`);
  console.log(`  ✓ Valid: ${result.valid}`);
  console.log(`  ✗ Corrupted: ${result.corrupted}\n`);

  if (corrupted.length === 0) {
    console.log('✅ All files are valid - no fixes needed\n');
    return;
  }

  // Phase 2: Restore corrupted files from git
  console.log(`Phase 2: Restoring ${corrupted.length} corrupted files from git\n`);

  for (const { path: filePath, error } of corrupted) {
    console.log(`\n${filePath}`);
    console.log(`  Error: ${error.substring(0, 80)}...`);

    const restored = restoreFromGit(filePath);
    if (restored) {
      result.restored++;
    } else {
      result.failed.push(filePath);
    }
  }

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('BASELINE VALIDATION RESULT');
  console.log('='.repeat(60));
  console.log(`✓ Valid files: ${result.valid}`);
  console.log(`✓ Restored from git: ${result.restored}`);

  if (result.failed.length > 0) {
    console.log(`\n✗ FAILED to restore ${result.failed.length} files:`);
    result.failed.forEach(f => console.log(`  - ${f}`));
    console.log('\n⚠️  STOP: Cannot proceed with corrupted files');
    console.log('    Manual intervention required or skip these guides');
    process.exit(1);
  } else {
    console.log('\n✅ All files validated or restored successfully');
    console.log('    Safe to proceed with SEO improvements');
  }
}

main();
