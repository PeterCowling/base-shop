import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { runInNewContext } from 'vm';

describe('init-shop wizard', () => {
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
        cwd: () => path.join(__dirname, '..', '..'),
        argv: [],
      },
      console: { log: jest.fn(), error: jest.fn() },
      URL,
      require: (p: string) => {
        if (p === 'node:fs') {
          return {
            existsSync: () => true,
            readdirSync: () => [
              { name: 'base', isDirectory: () => true },
              { name: 'template-app', isDirectory: () => true },
            ],
            writeFileSync: (_p: string, c: string) => {
              envContent = c;
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
                  ? ['stripe', 'paypal']
                  : ['dhl', 'ups']
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
        return require(p);
      },
    };

    const src = fs.readFileSync(
      path.join(__dirname, '../../scripts/src/init-shop.ts'),
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

