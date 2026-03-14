/**
 * @jest-environment node
 */

import { generatePreorderTxnId, serviceDateToBarPath } from '../preorder-helpers';

describe('serviceDateToBarPath', () => {
  it('TC-H01: single-digit day returns un-padded "1"', () => {
    const result = serviceDateToBarPath('2026-03-01');
    expect(result.monthName).toBe('March');
    expect(result.day).toBe('1');
  });

  it('TC-H02: December 31 returns correct month and day', () => {
    const result = serviceDateToBarPath('2026-12-31');
    expect(result.monthName).toBe('December');
    expect(result.day).toBe('31');
  });

  it('TC-H03: two-digit day returns un-padded string', () => {
    const result = serviceDateToBarPath('2026-03-14');
    expect(result.monthName).toBe('March');
    expect(result.day).toBe('14');
  });

  it('handles January correctly', () => {
    const result = serviceDateToBarPath('2026-01-05');
    expect(result.monthName).toBe('January');
    expect(result.day).toBe('5');
  });

  it('handles leap day (Feb 29)', () => {
    const result = serviceDateToBarPath('2028-02-29');
    expect(result.monthName).toBe('February');
    expect(result.day).toBe('29');
  });

  it('handles single-digit month', () => {
    const result = serviceDateToBarPath('2026-06-09');
    expect(result.monthName).toBe('June');
    expect(result.day).toBe('9');
  });
});

describe('generatePreorderTxnId', () => {
  it('TC-H04: returns string matching /^txn_\\d{17}$/', () => {
    const txnId = generatePreorderTxnId();
    expect(txnId).toMatch(/^txn_\d{17}$/);
  });

  it('starts with txn_ prefix', () => {
    const txnId = generatePreorderTxnId();
    expect(txnId.startsWith('txn_')).toBe(true);
  });

  it('has exactly 17 digits after prefix', () => {
    const txnId = generatePreorderTxnId();
    const digits = txnId.slice('txn_'.length);
    expect(digits).toHaveLength(17);
    expect(/^\d+$/.test(digits)).toBe(true);
  });

  it('two calls within 100ms produce valid format txnIds', () => {
    const id1 = generatePreorderTxnId();
    const id2 = generatePreorderTxnId();
    expect(id1).toMatch(/^txn_\d{17}$/);
    expect(id2).toMatch(/^txn_\d{17}$/);
  });
});
