import {
  aggregateActivationFunnel,
  buildActivationFunnelEvent,
  type ActivationFunnelEvent,
} from '../activationFunnel';

describe('activation funnel analytics', () => {
  it('TC-01: event utility emits required fields for each tracked step', () => {
    const event = buildActivationFunnelEvent({
      type: 'lookup_success',
      route: '/find-my-stay',
      sessionKey: 'sess-1',
    });

    expect(event.type).toBe('lookup_success');
    expect(event.route).toBe('/find-my-stay');
    expect(event.sessionKey).toBe('sess-1');
    expect(typeof event.ts).toBe('number');
  });

  it('TC-02: missing optional context does not break event emission', () => {
    const event = buildActivationFunnelEvent({
      type: 'arrival_mode_entered',
      sessionKey: 'sess-2',
    });

    expect(event.type).toBe('arrival_mode_entered');
    expect(event.route).toBeUndefined();
    expect(event.variant).toBeUndefined();
  });

  it('TC-03: dashboard aggregation computes step conversions correctly from fixtures', () => {
    const fixture: ActivationFunnelEvent[] = [
      { type: 'lookup_success', sessionKey: 'a', ts: Date.parse('2026-02-01T10:00:00Z') },
      { type: 'verify_success', sessionKey: 'a', ts: Date.parse('2026-02-01T10:03:00Z') },
      { type: 'guided_step_complete', sessionKey: 'a', ts: Date.parse('2026-02-01T10:04:00Z') },
      { type: 'arrival_mode_entered', sessionKey: 'a', ts: Date.parse('2026-02-01T10:08:00Z') },
      { type: 'lookup_success', sessionKey: 'b', ts: Date.parse('2026-02-02T11:00:00Z') },
      { type: 'verify_success', sessionKey: 'b', ts: Date.parse('2026-02-02T11:04:00Z') },
      { type: 'staff_lookup_used', sessionKey: 'staff-1', ts: Date.parse('2026-02-02T11:05:00Z') },
      { type: 'utility_action_used', sessionKey: 'a', ts: Date.parse('2026-02-02T11:06:00Z') },
      { type: 'lookup_success', sessionKey: 'c', ts: Date.parse('2026-02-03T09:00:00Z') },
    ];

    const result = aggregateActivationFunnel(fixture, {
      activationStart: 'lookup_success',
      readinessComplete: 'guided_step_complete',
    });

    expect(result.counts.lookup_success).toBe(3);
    expect(result.counts.verify_success).toBe(2);
    expect(result.counts.guided_step_complete).toBe(1);
    expect(result.counts.arrival_mode_entered).toBe(1);
    expect(result.counts.staff_lookup_used).toBe(1);
    expect(result.counts.utility_action_used).toBe(1);

    expect(result.conversion.lookupToVerify).toBeCloseTo(2 / 3, 5);
    expect(result.conversion.verifyToReadiness).toBeCloseTo(1 / 2, 5);
    expect(result.conversion.lookupToReadiness).toBeCloseTo(1 / 3, 5);
    expect(result.trends.weekly.length).toBeGreaterThan(0);
  });
});
