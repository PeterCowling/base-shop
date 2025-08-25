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
      'Home',
      '/',
      'Shop',
      '/shop',
      '',
      'about',
      'About Us',
      '',
      '',
      'color.primary=#fff',
      '',
      'n',
    ];
    const createShop = jest.fn();
      const envParse = jest.fn((env: Record<string, string>) => {
        if (
          !env.STRIPE_SECRET_KEY ||
          !env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
          !env.STRIPE_WEBHOOK_SECRET
        ) {
          throw new Error('invalid env');
        }
        return env;
      });
      const validateShopEnv = jest.fn(() =>
        envParse({
          STRIPE_SECRET_KEY: '',
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
          STRIPE_WEBHOOK_SECRET: '',
        })
      );

    const sandbox: any = {
      exports: {},
      module: { exports: {} },
      process: { version: 'v20.0.0', exit: jest.fn(), argv: [], cwd: () => '/' },
      console: { log: jest.fn(), error: jest.fn() },
      URL,
      require: (p: string) => {
        if (p === 'node:fs') {
          return {
            existsSync: () => true,
            readFileSync: () =>
              'STRIPE_SECRET_KEY=\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\nSTRIPE_WEBHOOK_SECRET=\n',
            readdirSync: () => [
              { name: 'base', isDirectory: () => true },
              { name: 'template-app', isDirectory: () => true },
            ],
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
        if (p.includes('@config/src/env')) {
          return { envSchema: { parse: envParse } };
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
          return { validateShopEnv };
        }
        if (p === './seedShop' || p.endsWith('/seedShop')) {
          return { seedShop: jest.fn() };
        }
        if (p === './generate-theme' || p.endsWith('/generate-theme')) {
          return { generateTheme: jest.fn(() => ({})) };
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
      }
    );

      expect(envParse).toHaveBeenCalledWith({
        STRIPE_SECRET_KEY: '',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
        STRIPE_WEBHOOK_SECRET: '',
      });

    expect(sandbox.console.error).toHaveBeenCalled();
    expect(sandbox.console.error.mock.calls[0][0]).toContain(
      'Environment validation failed'
    );
  });
});

