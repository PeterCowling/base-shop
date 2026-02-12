export type ActivationExperimentId =
  | 'onboardingCtaCopy'
  | 'onboardingStepOrder';

export type OnboardingCtaCopyVariant = 'control' | 'value-led';
export type OnboardingStepOrderVariant = 'standard' | 'eta-first';

export interface ActivationExperimentConfig {
  onboardingCtaCopy: {
    enabled: boolean;
    variants: readonly OnboardingCtaCopyVariant[];
  };
  onboardingStepOrder: {
    enabled: boolean;
    variants: readonly OnboardingStepOrderVariant[];
  };
}

export interface ActivationExperimentVariants {
  onboardingCtaCopy: OnboardingCtaCopyVariant;
  onboardingStepOrder: OnboardingStepOrderVariant;
}

export interface ActivationExperimentExposure {
  sessionKey: string;
  experimentId: ActivationExperimentId;
  variantId: string;
  converted: boolean;
}

export type ActivationExperimentMetrics = Record<
  ActivationExperimentId,
  Record<
    string,
    {
      sessions: number;
      conversions: number;
      rate: number;
    }
  >
>;

const DEFAULT_CONFIG: ActivationExperimentConfig = {
  onboardingCtaCopy: {
    enabled: true,
    variants: ['control', 'value-led'],
  },
  onboardingStepOrder: {
    enabled: true,
    variants: ['standard', 'eta-first'],
  },
};

function stableHash(input: string): number {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) + hash + input.charCodeAt(index);
  }
  return Math.abs(hash);
}

function pickVariant<T extends string>(
  sessionKey: string,
  experimentSalt: string,
  variants: readonly T[],
): T {
  const hash = stableHash(`${sessionKey}:${experimentSalt}`);
  const idx = hash % variants.length;
  return variants[idx];
}

export function resolveActivationExperimentConfig(
  overrides?: Partial<{
    onboardingCtaCopy: Partial<ActivationExperimentConfig['onboardingCtaCopy']>;
    onboardingStepOrder: Partial<ActivationExperimentConfig['onboardingStepOrder']>;
  }>,
): ActivationExperimentConfig {
  return {
    onboardingCtaCopy: {
      enabled:
        overrides?.onboardingCtaCopy?.enabled ??
        DEFAULT_CONFIG.onboardingCtaCopy.enabled,
      variants:
        overrides?.onboardingCtaCopy?.variants ??
        DEFAULT_CONFIG.onboardingCtaCopy.variants,
    },
    onboardingStepOrder: {
      enabled:
        overrides?.onboardingStepOrder?.enabled ??
        DEFAULT_CONFIG.onboardingStepOrder.enabled,
      variants:
        overrides?.onboardingStepOrder?.variants ??
        DEFAULT_CONFIG.onboardingStepOrder.variants,
    },
  };
}

export function assignActivationVariants(
  sessionKey: string,
  overrides?: Partial<{
    onboardingCtaCopy: Partial<ActivationExperimentConfig['onboardingCtaCopy']>;
    onboardingStepOrder: Partial<ActivationExperimentConfig['onboardingStepOrder']>;
  }>,
): ActivationExperimentVariants {
  const config = resolveActivationExperimentConfig(overrides);

  return {
    onboardingCtaCopy: config.onboardingCtaCopy.enabled
      ? pickVariant(sessionKey, 'onboardingCtaCopy', config.onboardingCtaCopy.variants)
      : 'control',
    onboardingStepOrder: config.onboardingStepOrder.enabled
      ? pickVariant(sessionKey, 'onboardingStepOrder', config.onboardingStepOrder.variants)
      : 'standard',
  };
}

function rate(conversions: number, sessions: number): number {
  if (sessions === 0) {
    return 0;
  }
  return conversions / sessions;
}

export function aggregateActivationExperimentMetrics(
  exposures: ActivationExperimentExposure[],
): ActivationExperimentMetrics {
  const aggregated: ActivationExperimentMetrics = {
    onboardingCtaCopy: {},
    onboardingStepOrder: {},
  };

  for (const exposure of exposures) {
    if (!aggregated[exposure.experimentId][exposure.variantId]) {
      aggregated[exposure.experimentId][exposure.variantId] = {
        sessions: 0,
        conversions: 0,
        rate: 0,
      };
    }

    const bucket = aggregated[exposure.experimentId][exposure.variantId];
    bucket.sessions += 1;
    if (exposure.converted) {
      bucket.conversions += 1;
    }
    bucket.rate = rate(bucket.conversions, bucket.sessions);
  }

  return aggregated;
}
