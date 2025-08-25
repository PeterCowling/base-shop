import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { runInNewContext } from 'vm';

describe('init-shop wizard', () => {
  it.skip('collects user input and validates environment', async () => {
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
      'sk',
      'pk',
      'whsec',
      'paypalId',
      'paypalSecret',
      'dhlKey',
      'https://cms.example.com',
      'cmsToken',
    ];
    const createShop = jest.fn();
    const envParse = jest.fn();
    let writtenEnv = '';
    const validateShopEnv = jest.fn(() => {
      const env: Record<string, string> = {};
      for (const line of writtenEnv.split(/\n+/)) {
        if (!line) continue;
        const [k, ...rest] = line.split('=');
        env[k] = rest.join('=');
      }
      envParse(env);
    });

    const sandbox: any = {
      exports: {},
      module: { exports: {} },
      process: { version: 'v20.0.0', exit: jest.fn() },
      console: { log: jest.fn(), error: jest.fn() },
      import: { meta: { url: 'file:///tmp/init-shop.ts' } },
      require: (p: string) => {
        if (p === 'node:fs') {
          return {
            existsSync: () => false,
            readFileSync: () => '',
            writeFileSync: (_f: string, data: string) => {
              writtenEnv = data;
            },
            readdirSync: (dir: any) => {
              const pathStr = String(dir);
              if (pathStr.includes('packages/themes')) {
                return [{ name: 'base', isDirectory: () => true }];
              }
              if (pathStr.endsWith('packages')) {
                return [{ name: 'template-app', isDirectory: () => true }];
              }
              return [];
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
          return { validateShopEnv, readEnvFile: jest.fn() };
        }
        return require(p);
      },
    };

    let src = fs.readFileSync(
      path.join(__dirname, '../../scripts/src/init-shop.ts'),
      'utf8'
    );
    src = src.replace(/import\.meta\.url/g, '"file:///tmp/init-shop.ts"');
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
      },
      { deploy: true }
    );

    expect(envParse).toHaveBeenCalledWith({
      STRIPE_SECRET_KEY: 'sk',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
      STRIPE_WEBHOOK_SECRET: 'whsec',
      PAYPAL_CLIENT_ID: 'paypalId',
      PAYPAL_SECRET: 'paypalSecret',
      DHL_KEY: 'dhlKey',
      CMS_SPACE_URL: 'https://cms.example.com',
      CMS_ACCESS_TOKEN: 'cmsToken',
    });

    expect(sandbox.console.error).not.toHaveBeenCalled();
  });
});

