/** @jest-environment node */

import {
  resetMediaMocks,
  restoreMediaMocks,
} from './media.test.mocks';
import {
  cleanTagsList,
  parseTagsString,
  extractTagsFromFormData,
  normalizeTagsForStorage,
  normalizeTagsInput,
} from '../media/tagUtils';

describe('tag utilities', () => {
  beforeEach(resetMediaMocks);
  afterEach(restoreMediaMocks);

  it('cleanTagsList trims values and removes duplicates', () => {
    expect(cleanTagsList([' foo ', 'bar', 'foo', ''])).toEqual(['foo', 'bar']);
  });

  it('parseTagsString handles JSON and delimited strings', () => {
    expect(parseTagsString('["hero"," feature "]')).toEqual(['hero', 'feature']);
    expect(parseTagsString('alpha, beta\ngamma')).toEqual([
      'alpha',
      'beta',
      'gamma',
    ]);
  });

  it('extractTagsFromFormData collects tags from multiple fields', () => {
    const formData = new FormData();
    formData.append('tags', '["hero"," feature "]');
    formData.append('tags[]', 'alpha, beta');

    expect(extractTagsFromFormData(formData)).toEqual([
      'hero',
      'feature',
      'alpha',
      'beta',
    ]);
  });

  it('normalizeTagsForStorage handles optional inputs', () => {
    expect(normalizeTagsForStorage(undefined)).toBeUndefined();
    expect(normalizeTagsForStorage(null)).toEqual([]);
    expect(normalizeTagsForStorage([' hero ', 'hero', 'feature'])).toEqual([
      'hero',
      'feature',
    ]);
  });

  it('normalizeTagsInput parses arrays and strings', () => {
    expect(normalizeTagsInput([' hero ', ''])).toEqual(['hero']);
    expect(normalizeTagsInput('["alpha"," beta "]')).toEqual(['alpha', 'beta']);
    expect(normalizeTagsInput(123)).toBeUndefined();
  });
});

