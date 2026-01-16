import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('Test Parallelization Validation', () => {
  test('vitest runs with parallel execution', async () => {
    // Check vitest config has parallel settings
    const { stdout } = await execAsync(
      'cat vitest.config.ts | grep -A 5 "pool:"',
      { cwd: process.cwd() }
    );

    expect(stdout).toContain('pool:');
    expect(stdout).toContain('forks');
  });

  test('package.json does not have parallelization disabled', async () => {
    const { stdout } = await execAsync(
      'cat package.json | grep "test:unit"',
      { cwd: process.cwd() }
    );

    // Should NOT contain --no-file-parallelism or --maxWorkers 1
    expect(stdout).not.toContain('--no-file-parallelism');
    expect(stdout).not.toContain('--maxWorkers 1');
  });

  test.skip('unit tests complete within time budget', async () => {
    // Skip in CI to avoid long-running tests
    // Run manually to verify performance improvement

    const start = Date.now();

    try {
      await execAsync('pnpm test:unit', {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes max
      });
    } catch (error) {
      // Tests might fail, but we're measuring time
      console.log('Test execution completed (with or without failures)');
    }

    const duration = Date.now() - start;
    const durationMinutes = duration / 1000 / 60;

    console.log(`Test duration: ${durationMinutes.toFixed(2)} minutes`);

    // Should complete in under 4 minutes (improved from 5-8 minutes)
    expect(durationMinutes).toBeLessThan(4);
  });
});
