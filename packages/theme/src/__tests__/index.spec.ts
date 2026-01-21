 
import { mergeExternalTokens,parseDsPackage, parseTheme } from '../';

describe('package exports', () => {
  it('exposes parseTheme', () => {
    const theme = parseTheme({
      id: 'test',
      name: 'Test Theme',
      brandColor: '#fff',
      createdBy: 'tester',
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    });
    expect(theme.name).toBe('Test Theme');
  });

  it('exposes parseDsPackage', () => {
    const ds = parseDsPackage({ tokens: { color: '#fff' } });
    expect(ds.tokens.color).toBe('#fff');
  });

  it('exposes mergeExternalTokens', () => {
    const result = mergeExternalTokens({ color: 'red' }, { color: 'blue' });
    expect(result.color).toBe('blue');
  });
});
