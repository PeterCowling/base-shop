import { describe, expect, it } from '@jest/globals';

import {
  buildPrimeLintDecision,
  collectPrimeLintTargets,
} from '../../src/ci/prime-lint-changed-files';

describe('prime-lint-changed-files', () => {
  it('TC-01: touched Prime source files are lint targets (regressions fail gate)', () => {
    const decision = buildPrimeLintDecision([
      'apps/prime/src/app/g/page.tsx',
      'apps/prime/src/hooks/useUuid.ts',
    ]);

    expect(decision).toMatchObject({
      shouldRun: true,
      skippedReason: 'none',
    });
    expect(decision.targets).toEqual([
      'apps/prime/src/app/g/page.tsx',
      'apps/prime/src/hooks/useUuid.ts',
    ]);
  });

  it('TC-02: untouched-file legacy debt does not trigger gate', () => {
    const decision = buildPrimeLintDecision([
      'apps/cms/src/app/page.tsx',
      'docs/plans/prime-guest-portal-gap-plan.md',
    ]);

    expect(decision).toMatchObject({
      shouldRun: false,
      skippedReason: 'no_prime_paths',
      targets: [],
    });
  });

  it('TC-03: clean Prime diffs keep only lintable files for CI/local gate', () => {
    const targets = collectPrimeLintTargets([
      'apps/prime/src/components/arrival/ArrivalHome.tsx',
      'apps/prime/public/_redirects',
      'apps/prime/functions/api/guest-session.ts',
      'apps/prime/src/styles/globals.css',
    ]);

    expect(targets).toEqual([
      'apps/prime/functions/api/guest-session.ts',
      'apps/prime/src/components/arrival/ArrivalHome.tsx',
    ]);
  });
});
