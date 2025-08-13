import path from 'node:path';
import { buildUpgradeChanges, resolveComponentName } from '../src/upgrade-shop';

describe('resolveComponentName', () => {
  it('resolves Avatar component', () => {
    const file = path.join(process.cwd(), 'packages/ui/src/components/atoms/Avatar.tsx');
    expect(resolveComponentName(file)).toBe('Avatar');
  });
});

describe('buildUpgradeChanges', () => {
  it('maps files to component names', () => {
    const rel = 'packages/ui/src/components/atoms/Avatar.tsx';
    const result = buildUpgradeChanges([rel], process.cwd());
    expect(result).toEqual([{ file: rel, componentName: 'Avatar' }]);
  });
});
