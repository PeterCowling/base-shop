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
      'color.primary=#fff',
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
      process: { version: 'v20.0.0', exit: jest.fn() },
      console: { log: jest.fn(), error: jest.fn() },
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
          return { createShop };
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

    expect(questions).toEqual([
      'Shop ID: ',
      'Display name (optional): ',
      'Logo URL (optional): ',
      'Contact email (optional): ',
      'Shop type (sale or rental) [sale]: ',
      'Select theme by number [1]: ',
      'Select template by number [1]: ',
      'Select payment providers by number (comma-separated, empty for none): ',
      'Select shipping providers by number (comma-separated, empty for none): ',
      'STRIPE_SECRET_KEY: ',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ',
      'STRIPE_WEBHOOK_SECRET: ',
      'PAYPAL_CLIENT_ID: ',
      'PAYPAL_SECRET: ',
      'SANITY_PROJECT_ID: ',
      'SANITY_DATASET: ',
      'SANITY_TOKEN: ',
      'Nav label (leave empty to finish): ',
      'Nav URL: ',
      'Nav label (leave empty to finish): ',
      'Nav URL: ',
      'Nav label (leave empty to finish): ',
      'Page slug (leave empty to finish): ',
      'Page title: ',
      'Page slug (leave empty to finish): ',
      'Theme token override (key=value, blank to finish): ',
      'Theme token override (key=value, blank to finish): ',
      'Setup CI workflow? (y/N): ',
    ]);

    expect(createShop).toHaveBeenCalledWith(
      'shop-demo',
      {
        name: 'Demo Shop',
        logo: 'https://example.com/logo.png',
        contactInfo: 'contact@example.com',
        type: 'sale',
        theme: 'base',
        template: 'template-app',
        payment: ['stripe', 'paypal'],
        shipping: ['dhl'],
        navItems: [
          { label: 'Home', url: '/' },
          { label: 'Shop', url: '/shop' },
        ],
        pages: [
          {
            slug: 'about',
            title: { en: 'About Us' },
            components: [],
          },
        ],
        themeOverrides: { 'color.primary': '#fff' },
      },
      { deploy: true }
    );

    expect(envParse).toHaveBeenCalledWith({
      STRIPE_SECRET_KEY: 'sk',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
      STRIPE_WEBHOOK_SECRET: 'whsec',
      PAYPAL_CLIENT_ID: 'client',
      PAYPAL_SECRET: 'secret',
      SANITY_PROJECT_ID: 'proj',
      SANITY_DATASET: 'dataset',
      SANITY_TOKEN: 'token',
    });

    expect(sandbox.console.error).not.toHaveBeenCalled();
  });
});

