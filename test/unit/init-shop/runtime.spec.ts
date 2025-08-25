import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { runInNewContext } from 'vm';

describe('init-shop wizard - runtime checks', () => {
  it('exits when Node.js version is below 20', () => {
    const sandbox: any = {
      exports: {},
      module: { exports: {} },
      process: {
        version: 'v18.0.0',
        exit: jest.fn(() => {
          throw new Error('exit');
        }),
      },
      console: { log: jest.fn(), error: jest.fn() },
      URL,
      require: (p: string) => {
        if (p === 'node:child_process') {
          return { execSync: () => '10.0.0' };
        }
        return {};
      },
    };

    const src = fs.readFileSync(
      path.join(__dirname, '../../../scripts/src/init-shop.ts'),
      'utf8'
    );
    const transpiled = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;

    expect(() => runInNewContext(transpiled, sandbox)).toThrow('exit');
    expect(sandbox.console.error).toHaveBeenCalledWith(
      expect.stringContaining('Node.js v20 or later is required')
    );
  });

  it('exits when pnpm version is below 10', () => {
    const sandbox: any = {
      exports: {},
      module: { exports: {} },
      process: {
        version: 'v20.0.0',
        exit: jest.fn(() => {
          throw new Error('exit');
        }),
      },
      console: { log: jest.fn(), error: jest.fn() },
      URL,
      require: (p: string) => {
        if (p === 'node:child_process') {
          return { execSync: () => '9.0.0' };
        }
        return {};
      },
    };

    const src = fs.readFileSync(
      path.join(__dirname, '../../../scripts/src/init-shop.ts'),
      'utf8'
    );
    const transpiled = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;

    expect(() => runInNewContext(transpiled, sandbox)).toThrow('exit');
    expect(sandbox.console.error).toHaveBeenCalledWith(
      expect.stringContaining('pnpm v10 or later is required')
    );
  });
});

