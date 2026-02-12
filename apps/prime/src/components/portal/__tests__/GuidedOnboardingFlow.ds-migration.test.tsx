/**
 * DS Migration tests for GuidedOnboardingFlow (TASK-06)
 * Verifies all raw Tailwind palette classes have been replaced with semantic DS tokens.
 */

import { render } from '@testing-library/react';

import { usePreArrivalMutator } from '../../../hooks/mutator/usePreArrivalMutator';
import { useFetchPreArrivalData } from '../../../hooks/pureData/useFetchPreArrivalData';
import GuidedOnboardingFlow from '../GuidedOnboardingFlow';

jest.mock('../../../hooks/mutator/usePreArrivalMutator', () => ({
  usePreArrivalMutator: jest.fn(),
}));

jest.mock('../../../hooks/pureData/useFetchPreArrivalData', () => ({
  useFetchPreArrivalData: jest.fn(),
}));

jest.mock('../../../lib/analytics/activationFunnel', () => ({
  recordActivationFunnelEvent: jest.fn(),
}));

jest.mock('../../../lib/experiments/activationExperiments', () => ({
  assignActivationVariants: () => ({
    onboardingStepOrder: 'method-first',
    onboardingCtaCopy: 'control',
  }),
}));

jest.mock('@acme/design-system/primitives', () => ({
  StepFlowShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@acme/ui/components/ab/ExperimentGate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const RAW_PALETTE = {
  blue: /\b(bg|text|border)-blue-\d+/,
  gray: /\b(bg|text|border)-gray-\d+/,
  slate: /\b(bg|text|border)-slate-\d+/,
  emerald: /\b(bg|text|border)-emerald-\d+/,
  sky: /\b(bg|text)-sky-\d+/,
};

function setupMocks(overrides: { isLoading?: boolean } = {}) {
  (useFetchPreArrivalData as jest.Mock).mockReturnValue({
    data: null,
    error: null,
    isLoading: overrides.isLoading ?? false,
    isError: false,
    effectiveData: {
      etaWindow: null,
      etaMethod: null,
      etaNote: '',
      etaConfirmedAt: null,
      cashReadyCityTax: false,
      cashReadyDeposit: false,
      routeSaved: null,
      arrivalMethodPreference: null,
      arrivalConfidence: null,
      checklistProgress: {
        routePlanned: false,
        etaConfirmed: false,
        cashPrepared: false,
        rulesReviewed: false,
        locationSaved: false,
      },
      updatedAt: 0,
    },
    refetch: jest.fn(),
  });

  (usePreArrivalMutator as jest.Mock).mockReturnValue({
    updateChecklistItem: jest.fn().mockResolvedValue(undefined),
    updateChecklistItems: jest.fn(),
    setEta: jest.fn().mockResolvedValue(undefined),
    setCashReadyCityTax: jest.fn(),
    setCashReadyDeposit: jest.fn(),
    saveRoute: jest.fn().mockResolvedValue(undefined),
    setPersonalization: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    isError: false,
  });
}

function assertNoRawPalette(html: string) {
  for (const [name, pattern] of Object.entries(RAW_PALETTE)) {
    expect(html).not.toMatch(pattern);
  }
}

describe('GuidedOnboardingFlow DS Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-07: No raw palette classes remain (loading state)
  it('loading state should use semantic tokens, not raw palette classes', () => {
    setupMocks({ isLoading: true });
    const { container } = render(
      <GuidedOnboardingFlow onComplete={jest.fn()} />,
    );
    assertNoRawPalette(container.innerHTML);
  });

  // TC-07: No raw palette classes remain (step 1 — method first)
  it('step 1 should use semantic tokens, not raw palette classes', () => {
    setupMocks();
    const { container } = render(
      <GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />,
    );
    const html = container.innerHTML;
    assertNoRawPalette(html);
    // Should contain semantic tokens
    expect(html).toMatch(/\btext-foreground\b/);
    expect(html).toMatch(/\bbg-muted\b/);
    expect(html).toMatch(/\bbg-background\b/);
  });
});
