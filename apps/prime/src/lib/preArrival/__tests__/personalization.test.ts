import { ROUTES_TO_POSITANO } from '../../../data/routes';
import {
  getDefaultEtaWindow,
  getEtaWindowOptions,
  sortRoutesForPersonalization,
} from '../personalization';

describe('pre-arrival personalization helpers', () => {
  it('TC-01: personalization answers alter recommended route ordering', () => {
    const sorted = sortRoutesForPersonalization(ROUTES_TO_POSITANO, 'ferry');
    expect(sorted[0]?.primaryMode).toBe('ferry');
  });

  it('TC-02: ETA defaults adapt to confidence level', () => {
    expect(getDefaultEtaWindow('confident')).toBe('17:30-18:00');
    expect(getDefaultEtaWindow('need-guidance')).toBe('18:00-18:30');
    expect(getEtaWindowOptions('need-guidance')[0]).toBe('18:00-18:30');
  });

  it('TC-04: neutral defaults are stable when personalization is not set', () => {
    expect(getDefaultEtaWindow(null)).toBe('18:00-18:30');
    expect(getEtaWindowOptions(null)).toContain('18:00-18:30');
  });
});
