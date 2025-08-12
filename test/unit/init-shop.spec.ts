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
      'base',
      'template-app',
      '1,2',
      '1',
      'n',
    ];
    const createShop = jest.fn();
    const envParse = jest.fn((env: Record<string, string>) => {
      if (!env.STRIPE_SECRET_KEY || !env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('invalid env');
      }
      return env;
    });
    const validateShopEnv = jest.fn(() =>
      envParse({
        STRIPE_SECRET_KEY: '',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
      })
    );

    const sandbox: any = {
      exports: {},
      module: { exports: {} },
      process: { version: 'v20.0.0', exit: jest.fn() },
      console: { log: jest.fn(), error: jest.fn() },
      require: (p: string) => {
        if (p === 'node:fs') {
          return {
            existsSync: () => true,
            readFileSync: () =>
              'STRIPE_SECRET_KEY=\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\n',
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
        if (p.includes('@acme/config/env')) {
          return { envSchema: { parse: envParse } };
        }
        if (p.includes('../../packages/platform-core/src/createShop/listProviders')) {
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
        if (p.includes('../../packages/platform-core/src/createShop')) {
          return { createShop };
        }
        if (p.includes('../../packages/platform-core/src/configurator')) {
          return { validateShopEnv };
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
      'Theme [base]: ',
      'Template [template-app]: ',
      'Select payment providers by number (comma-separated, empty for none): ',
      'Select shipping providers by number (comma-separated, empty for none): ',
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
      },
      { deploy: true }
    );

    expect(envParse).toHaveBeenCalledWith({
      STRIPE_SECRET_KEY: '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
    });

    expect(sandbox.console.error).toHaveBeenCalled();
    expect(sandbox.console.error.mock.calls[0][0]).toContain(
      'Environment validation failed'
    );
  });
});

