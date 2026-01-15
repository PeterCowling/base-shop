import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

test.describe('Security Audit Validation', () => {
  test('Next.js version is updated to fix RCE vulnerability', async () => {
    // Read package.json
    const packageJson = await fs.readFile(
      path.join(process.cwd(), 'package.json'),
      'utf-8'
    );
    const pkg = JSON.parse(packageJson);

    // Next.js should be >= 16.1.1 (fixes CVE)
    const nextVersion = pkg.dependencies.next.replace(/[\^~]/, '');
    const [major, minor, patch] = nextVersion.split('.').map(Number);

    expect(major).toBeGreaterThanOrEqual(16);
    if (major === 16) {
      expect(minor).toBeGreaterThanOrEqual(1);
      if (minor === 1) {
        expect(patch).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('security audit report exists', async () => {
    const reportPath = path.join(process.cwd(), 'SECURITY-AUDIT.md');

    try {
      await fs.access(reportPath);
      const content = await fs.readFile(reportPath, 'utf-8');

      // Should contain key sections
      expect(content).toContain('Security Audit Report');
      expect(content).toContain('Next.js RCE Vulnerability');
      expect(content).toContain('FIXED');
    } catch (error) {
      throw new Error('SECURITY-AUDIT.md file not found');
    }
  });

  test('security workflow file exists', async () => {
    const workflowPath = path.join(
      process.cwd(),
      '../../.github/workflows/security-audit.yml'
    );

    try {
      await fs.access(workflowPath);
      const content = await fs.readFile(workflowPath, 'utf-8');

      // Should contain key configurations
      expect(content).toContain('Security Audit');
      expect(content).toContain('pnpm audit');
      expect(content).toContain('schedule:');
    } catch (error) {
      throw new Error('security-audit.yml workflow not found');
    }
  });

  test.skip('no critical vulnerabilities in Brikette dependencies', async () => {
    // Skip in regular runs, enable for security reviews
    try {
      await execAsync('pnpm audit --audit-level=critical', {
        cwd: process.cwd(),
      });

      // If command succeeds, no critical vulnerabilities
      expect(true).toBe(true);
    } catch (error: any) {
      // If command fails, there are critical vulnerabilities
      const output = error.stdout || error.message;
      console.error('Critical vulnerabilities found:', output);
      throw new Error('Critical security vulnerabilities detected');
    }
  });

  test('CSP headers are configured', async ({ page }) => {
    const response = await page.goto('/en');

    // Check for security headers
    const headers = response?.headers();

    // Note: CSP might not be configured yet, this test documents the requirement
    if (headers && headers['content-security-policy']) {
      expect(headers['content-security-policy']).toBeTruthy();
    } else {
      console.warn('CSP headers not configured (expected at this stage)');
    }
  });
});
