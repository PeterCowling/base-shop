import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

describe('configurator CLI integration', () => {
  it('exits with code 1 when required env vars are missing', () => {
    const env = {
      ...process.env,
      STRIPE_SECRET_KEY: 'sk',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
    };
    delete env.CART_COOKIE_SECRET;
    const result = spawnSync('node', ['bin/configurator.cjs', 'dev'], {
      cwd: resolve(__dirname, '..'),
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Missing required environment variables');
  });

  it('exits with code 1 when an unsupported command is used', () => {
    const env = {
      ...process.env,
      STRIPE_SECRET_KEY: 'sk',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
      CART_COOKIE_SECRET: 'secret',
    };
    const result = spawnSync('node', ['bin/configurator.cjs', 'foo'], {
      cwd: resolve(__dirname, '..'),
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(
      'Usage: pnpm configurator <dev|build|deploy>'
    );
  });

  it('delegates to vite dev and exits with code 0', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'configurator-cli-'));
    const logFile = join(tempDir, 'spawn.json');
    const stub = resolve(__dirname, 'spawnSync.stub.cjs');
    const result = spawnSync(
      'node',
      ['--require', stub, 'bin/configurator.cjs', 'dev'],
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads temp log file for assertions (ENG-1234)
    const { command, args } = JSON.parse(readFileSync(logFile, 'utf8'));
    expect(command).toBe('vite');
    expect(args).toEqual(['dev']);
  });

  it('delegates to vite build and exits with code 0', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'configurator-cli-'));
    const logFile = join(tempDir, 'spawn.json');
    const stub = resolve(__dirname, 'spawnSync.stub.cjs');
    const result = spawnSync(
      'node',
      ['--require', stub, 'bin/configurator.cjs', 'build'],
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads temp log file for assertions (ENG-1234)
    const { command, args } = JSON.parse(readFileSync(logFile, 'utf8'));
    expect(command).toBe('vite');
    expect(args).toEqual(['build']);
  });

  it('delegates to wrangler pages deploy .vercel/output/static and exits with code 0', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'configurator-cli-'));
    const logFile = join(tempDir, 'spawn.json');
    const stub = resolve(__dirname, 'spawnSync.stub.cjs');
    const result = spawnSync(
      'node',
      ['--require', stub, 'bin/configurator.cjs', 'deploy'],
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- reads temp log file for assertions (ENG-1234)
    const { command, args } = JSON.parse(readFileSync(logFile, 'utf8'));
    expect(command).toBe('wrangler');
    expect(args).toEqual(['pages', 'deploy', '.vercel/output/static']);
  });
});
