import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { runInNewContext } from 'vm';

describe('init-shop configurator - theme', () => {
  it('supports theme overrides via CLI flags', async () => {
    const questions: string[] = [];
    const answers = [
      'demo',
      'Demo Shop',
      'https://example.com/logo.png',
      'contact@example.com',
      '',
      '1',
      '1',
      '1,2',
      '1',
      '1',
      'sk',
      'pk',
      'whsec',
      'client',
      'secret',
      'proj',
      'dataset',
      'token',
      'Home',
      '/',
      'Shop',
      '/shop',
      '',
      'about',
      'About Us',
      '',
      'n',
      'n',
      'n',
    ];
    const createShop = jest.fn();
    const envParse = jest.fn((env: Record<string, string>) => env);
    let envContent = '';
    let pkgContent = '{"dependencies":{}}';
    const validateShopEnv = jest.fn(() => {
      const env: Record<string, string> = {};
      for (const line of envContent.split(/\n+/)) {
        const [k, ...r] = line.split('=');
        if (k) env[k] = r.join('=');
      }
      envParse(env);
    });

    const sandbox: any = {
      exports: {},
      module: { exports: {} },
      process: {
        version: 'v20.0.0',
        exit: jest.fn(),
        cwd: () => path.join(__dirname, '..', '..', '..'),
        argv: [
          'node',
          'init-shop',
          '--brand',
          '#336699',
          '--tokens',
          'overrides.json',
        ],
      },
      console: { log: jest.fn(), error: jest.fn() },
      URL,
    };

    sandbox.require = makeRequire(path.join(__dirname, '../../../../scripts/src'));

    function makeRequire(currentDir: string) {
      return (p: string) => {
        if (p === 'node:fs') {
          return {
            existsSync: () => true,
            readdirSync: (dir: string) => {
              if (dir.includes('packages/plugins')) {
                return [
                  { name: 'paypal', isDirectory: () => true },
                  { name: 'sanity', isDirectory: () => true },
                ];
              }
              return [
                { name: 'base', isDirectory: () => true },
                { name: 'template-app', isDirectory: () => true },
              ];
            },
            readFileSync: (fp: string) => {
              if (fp.endsWith('apps/shop-demo/package.json')) return pkgContent;
              if (fp.includes('packages/plugins/paypal/package.json'))
                return '{"name":"@acme/plugin-paypal"}';
              if (fp.includes('packages/plugins/sanity/package.json'))
                return '{"name":"@acme/plugin-sanity"}';
              if (fp === 'overrides.json')
                return '{"--color-bg":"0 0% 0%"}';
              return '';
            },
            writeFileSync: (fp: string, c: string) => {
              if (fp.endsWith('.env')) envContent = c;
              else if (fp.endsWith('package.json')) pkgContent = c;
            },
          };
        }
        if (p === 'node:path') return require('node:path');
        if (p === 'node:child_process') {
          return { spawnSync: jest.fn(), execSync: () => '10.0.0' };
        }
        if (p === 'node:readline/promises') {
          return {
            createInterface: () => ({
              question: (q: string) => {
                questions.push(q);
                return Promise.resolve(answers.shift()!);
              },
              close: () => undefined,
            }),
          };
        }
        if (p.includes('@acme/platform-core/createShop/listProviders')) {
          return {
            listProviders: jest.fn((kind: string) =>
              Promise.resolve(
                kind === 'payment'
                  ? [
                      {
                        id: 'stripe',
                        name: 'stripe',
                        envVars: [
                          'STRIPE_SECRET_KEY',
                          'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
                          'STRIPE_WEBHOOK_SECRET',
                        ],
                      },
                      {
                        id: 'paypal',
                        name: 'paypal',
                        envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_SECRET'],
                      },
                    ]
                  : [
                      { id: 'dhl', name: 'dhl', envVars: [] },
                      { id: 'ups', name: 'ups', envVars: [] },
                    ]
              )
            ),
          };
        }
        if (p.includes('@acme/platform-core/createShop')) {
          return {
            createShop,
            loadBaseTokens: () => ({
              '--color-primary': '100 50% 50%',
              '--color-primary-fg': '0 0% 10%',
            }),
          };
        }
        if (p.includes('./generate-theme')) {
          return {
            generateThemeTokens: () => ({
              '--color-primary': '210 60% 40%',
              '--color-primary-fg': '0 0% 100%',
            }),
          };
        }
        if (p.includes('./seedShop')) {
          return { seedShop: jest.fn() };
        }
        if (p.includes('@acme/platform-core/configurator')) {
          return {
            validateShopEnv,
            readEnvFile: () => ({
              STRIPE_SECRET_KEY: '',
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
              STRIPE_WEBHOOK_SECRET: '',
            }),
            pluginEnvVars: {
              stripe: [
                'STRIPE_SECRET_KEY',
                'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
                'STRIPE_WEBHOOK_SECRET',
              ],
              paypal: ['PAYPAL_CLIENT_ID', 'PAYPAL_SECRET'],
              sanity: ['SANITY_PROJECT_ID', 'SANITY_DATASET', 'SANITY_TOKEN'],
            },
          };
        }
        if (p.includes('./runtime')) {
          return { ensureRuntime: jest.fn() };
        }
        if (p.includes('@acme/platform-core/repositories/pages')) {
          return {};
        }
        if (p === '@prisma/client') {
          return { PrismaClient: jest.fn().mockImplementation(() => ({})) };
        }
        if (p.startsWith('./') || p.startsWith('../')) {
          const filePath = path.join(currentDir, `${p}.ts`);
          const code = fs.readFileSync(filePath, 'utf8');
          const compiled = ts.transpileModule(code, {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              esModuleInterop: true,
            },
          }).outputText;
          const childSandbox = { ...sandbox, module: { exports: {} } };
          childSandbox.exports = childSandbox.module.exports;
          childSandbox.require = makeRequire(path.dirname(filePath));
          runInNewContext(compiled, childSandbox);
          return childSandbox.module.exports;
        }
        return require(p);
      };
    }

    const src = fs.readFileSync(
      path.join(__dirname, '../../../../scripts/src/init-shop.ts'),
      'utf8'
    );
    const transpiled = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;

    const promise = runInNewContext(transpiled, sandbox);
    await promise;

    expect(createShop).toHaveBeenCalledWith(
      'shop-demo',
      expect.objectContaining({
        themeOverrides: {
          '--color-primary': '210 60% 40%',
          '--color-primary-fg': '0 0% 100%',
          '--color-bg': '0 0% 0%',
        },
      })
    );

    expect(questions.some((q) => q.includes('Primary brand color'))).toBe(false);
  });
});
