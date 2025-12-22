import { readFileSync } from 'fs';
import { join } from 'path';
import ts from 'typescript';
import { runInNewContext } from 'vm';

const releaseMock = jest.fn();

jest.mock('@acme/platform-machine', () => ({
  releaseDepositsOnce: (...args: any[]) => releaseMock(...args),
}));

function runReleaseDeposits() {
  const src = readFileSync(
    join(__dirname, '../../../scripts/src/release-deposits.ts'),
    'utf8',
  );
  const transpiled = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    require,
    console,
    process,
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
}

describe('scripts/release-deposits', () => {
  beforeEach(() => {
    jest.resetModules();
    releaseMock.mockReset();
    process.exit = jest.fn() as any;
  });

  it('calls releaseDepositsOnce', async () => {
    releaseMock.mockResolvedValue(undefined);
    runReleaseDeposits();
    await new Promise(process.nextTick);
    expect(releaseMock).toHaveBeenCalled();
  });
});
