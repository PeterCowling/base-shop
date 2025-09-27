/**
 * Lightweight re-export tests to increase coverage on thin entry files.
 *
 * These tests intentionally mock the large submodule graphs under
 * `components`, `hooks`, and `utils` so importing `src/index.ts` doesn't
 * recursively load heavy UI trees. This keeps the test fast and focused,
 * while still executing the module under test lines for coverage.
 */

import path from 'path';

describe('package entry re-exports', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('re-exports from components/hooks/utils via src/index.ts', async () => {
    const componentsIdx = path.join(__dirname, '..', 'src', 'components', 'index.ts');
    const hooksIdx = path.join(__dirname, '..', 'src', 'hooks', 'index.ts');
    const utilsIdx = path.join(__dirname, '..', 'src', 'utils', 'index.ts');

    const imported = await new Promise<any>((resolve) => {
      jest.isolateModules(() => {
        // Use doMock to avoid hoist-time path initialization issues
        jest.doMock(componentsIdx, () => ({ __esModule: true, CompA: 'COMP_A' }), { virtual: true });
        jest.doMock(hooksIdx, () => ({ __esModule: true, useFoo: () => 'ok' }), { virtual: true });
        jest.doMock(utilsIdx, () => ({ __esModule: true, util: () => 'ok' }), { virtual: true });
        const mod = require('../src/index.ts');
        resolve(mod);
      });
    });

    expect(imported).toBeDefined();
    expect(imported.CompA).toBe('COMP_A');
    expect(typeof imported.useFoo).toBe('function');
    expect(typeof imported.util).toBe('function');
  });

  it('re-exports account components via src/account.ts', async () => {
    const accountIdx = path.join(__dirname, '..', 'src', 'components', 'account', 'index.ts');

    const imported = await new Promise<any>((resolve) => {
      jest.isolateModules(() => {
        jest.doMock(
          accountIdx,
          () => ({ __esModule: true, ProfilePage: function ProfilePage() { return null; } }),
          { virtual: true }
        );
        const mod = require('../src/account.ts');
        resolve(mod);
      });
    });

    expect(imported).toBeDefined();
    expect(typeof imported.ProfilePage).toBe('function');
  });
});
