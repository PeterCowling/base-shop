import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { runInNewContext } from 'vm';

describe('init-shop wizard - env', () => {
  it('collects user input and validates environment', async () => {
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
      '#336699',
      '',
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
        argv: [],
      },
      console: { log: jest.fn(), error: jest.fn() },
      URL,
      require: (p: string) => {
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
        if (p.includes('generate-theme')) {
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
        if (p.includes('./utils/providers')) {
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
            listPlugins: jest.fn(() => [
              {
                id: 'sanity',
                packageName: '@acme/plugin-sanity',
                envVars: [
                  'SANITY_PROJECT_ID',
                  'SANITY_DATASET',
                  'SANITY_TOKEN',
                ],
              },
            ]),
          };
        }
        if (p.includes('./apply-page-template')) {
          return { applyPageTemplate: jest.fn() };
        }
        if (p.includes('./utils/prompt') || p.endsWith('/prompt')) {
          const promptSrc = fs.readFileSync(
            path.join(__dirname, '../../../scripts/src/utils/prompt.ts'),
            'utf8'
          );
          const transpiledPrompt = ts.transpileModule(promptSrc, {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              esModuleInterop: true,
            },
          }).outputText;
          const promptSandbox: any = { ...sandbox };
          promptSandbox.module = { exports: {} };
          promptSandbox.exports = promptSandbox.module.exports;
          runInNewContext(transpiledPrompt, promptSandbox);
          return promptSandbox.module.exports;
        }
        if (p.includes('./utils/theme')) {
          const themeSrc = fs.readFileSync(
            path.join(__dirname, '../../../scripts/src/utils/theme.ts'),
            'utf8'
          );
          const transpiledTheme = ts.transpileModule(themeSrc, {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              esModuleInterop: true,
            },
          }).outputText;
          const themeSandbox: any = { ...sandbox };
          themeSandbox.module = { exports: {} };
          themeSandbox.exports = themeSandbox.module.exports;
          runInNewContext(transpiledTheme, themeSandbox);
          return themeSandbox.module.exports;
        }
        if (p.includes('./runtime')) {
          return { ensureRuntime: jest.fn() };
        }
        if (p.includes('./env')) {
          const envSrc = fs.readFileSync(
            path.join(__dirname, '../../../scripts/src/env.ts'),
            'utf8'
          );
          const transpiledEnv = ts.transpileModule(envSrc, {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              esModuleInterop: true,
            },
          }).outputText;
          const envSandbox: any = { ...sandbox };
          envSandbox.module = { exports: {} };
          envSandbox.exports = envSandbox.module.exports;
          runInNewContext(transpiledEnv, envSandbox);
          return envSandbox.module.exports;
        }
        return require(p);
      },
    };

    const src = fs.readFileSync(
      path.join(__dirname, '../../../scripts/src/init-shop.ts'),
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
        name: 'Demo Shop',
        logo: 'https://example.com/logo.png',
        contactInfo: 'contact@example.com',
        theme: 'base',
        template: 'template-app',
        themeOverrides: {
          '--color-primary': '210 60% 40%',
          '--color-primary-fg': '0 0% 100%',
        },
      })
    );

    expect(envParse).toHaveBeenCalled();

    expect(sandbox.console.error).not.toHaveBeenCalled();
  });
});

