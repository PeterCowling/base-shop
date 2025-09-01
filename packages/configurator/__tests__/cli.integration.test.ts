import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

describe('configurator CLI integration', () => {
  it('delegates to vite dev and exits with code 0', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'configurator-cli-'));
    const logFile = join(tempDir, 'spawn.json');
    const stub = resolve(__dirname, 'spawnSync.stub.cjs');
    const result = spawnSync(
      'node',
      ['--require', stub, 'bin/configurator.js', 'dev'],
      {
        cwd: resolve(__dirname, '..'),
        env: {
          ...process.env,
          STRIPE_SECRET_KEY: 'sk',
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
          CART_COOKIE_SECRET: 'secret',
          SPAWN_SYNC_LOG: logFile,
        },
      }
    );
    expect(result.status).toBe(0);
    const { command, args } = JSON.parse(readFileSync(logFile, 'utf8'));
    expect(command).toBe('vite');
    expect(args).toEqual(['dev']);
  });
});
