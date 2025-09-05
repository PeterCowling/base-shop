/**
 * @jest-environment node
 */
import { getCsrfToken } from '../getCsrfToken';

describe('getCsrfToken on server', () => {
  it('returns undefined when document is not available', () => {
    expect(getCsrfToken()).toBeUndefined();
  });
});

