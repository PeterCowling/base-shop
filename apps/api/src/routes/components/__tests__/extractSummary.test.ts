import { extractSummary } from '../[shopId]';

jest.mock('fs', () => require('memfs').fs);

describe('extractSummary', () => {
  it('returns empty string when changelog is empty', () => {
    expect(extractSummary('')).toBe('');
  });

  it('returns empty string when changelog has only comments', () => {
    const log = '# heading\n\n  # another comment\n';
    expect(extractSummary(log)).toBe('');
  });

  it('returns first non-comment line', () => {
    const log = '# heading\n\nFirst change\n# another heading';
    expect(extractSummary(log)).toBe('First change');
  });
});

