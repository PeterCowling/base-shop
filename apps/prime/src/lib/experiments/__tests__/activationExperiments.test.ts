import {
  type ActivationExperimentExposure,
  aggregateActivationExperimentMetrics,
  assignActivationVariants,
  resolveActivationExperimentConfig,
} from '../activationExperiments';

describe('activation experiments', () => {
  it('TC-01: deterministic variant assignment for same user/session key', () => {
    const first = assignActivationVariants('occ_123');
    const second = assignActivationVariants('occ_123');

    expect(first).toEqual(second);
  });

  it('TC-02: experiment flags default safely when config missing', () => {
    const config = resolveActivationExperimentConfig(undefined);

    expect(config.onboardingCtaCopy.enabled).toBe(true);
    expect(config.onboardingStepOrder.enabled).toBe(true);

    const decision = assignActivationVariants('occ_456', {
      onboardingCtaCopy: { enabled: false },
      onboardingStepOrder: undefined,
    });

    expect(decision.onboardingCtaCopy).toBe('control');
    expect(['standard', 'eta-first']).toContain(decision.onboardingStepOrder);
  });

  it('TC-03: variant metrics aggregate separately and accurately', () => {
    const exposures: ActivationExperimentExposure[] = [
      {
        sessionKey: 'a',
        experimentId: 'onboardingCtaCopy',
        variantId: 'control',
        converted: true,
      },
      {
        sessionKey: 'b',
        experimentId: 'onboardingCtaCopy',
        variantId: 'control',
        converted: false,
      },
      {
        sessionKey: 'c',
        experimentId: 'onboardingCtaCopy',
        variantId: 'value-led',
        converted: true,
      },
      {
        sessionKey: 'd',
        experimentId: 'onboardingStepOrder',
        variantId: 'eta-first',
        converted: true,
      },
    ];

    const aggregated = aggregateActivationExperimentMetrics(exposures);

    expect(aggregated.onboardingCtaCopy.control.sessions).toBe(2);
    expect(aggregated.onboardingCtaCopy.control.conversions).toBe(1);
    expect(aggregated.onboardingCtaCopy.control.rate).toBeCloseTo(0.5, 5);
    expect(aggregated.onboardingCtaCopy['value-led'].sessions).toBe(1);
    expect(aggregated.onboardingCtaCopy['value-led'].conversions).toBe(1);
    expect(aggregated.onboardingStepOrder['eta-first'].sessions).toBe(1);
  });
});
