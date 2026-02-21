import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { usePreArrivalMutator } from '../../../hooks/mutator/usePreArrivalMutator';
import { useFetchPreArrivalData } from '../../../hooks/pureData/useFetchPreArrivalData';
import { recordActivationFunnelEvent } from '../../../lib/analytics/activationFunnel';
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
    onboardingStepOrder: 'standard',
    onboardingCtaCopy: 'control',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@acme/design-system/atoms', () => ({
  Toast: ({ open, message, actionLabel, onAction, variant }: {
    open: boolean; message: string; actionLabel?: string;
    onAction?: () => void; variant?: string;
  }) =>
    open ? (
      <div data-cy="error-toast" data-variant={variant}>
        <span>{message}</span>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction}>{actionLabel}</button>
        )}
      </div>
    ) : null,
  Skeleton: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-cy="skeleton" className={className} {...props} />
  ),
}));

describe('GuidedOnboardingFlow', () => {
  const mockSetPersonalization = jest.fn().mockResolvedValue(undefined);
  const mockSaveRoute = jest.fn().mockResolvedValue(undefined);
  const mockSetEta = jest.fn().mockResolvedValue(undefined);
  const mockUpdateChecklistItem = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();

    (useFetchPreArrivalData as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isLoading: false,
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
      updateChecklistItem: mockUpdateChecklistItem,
      updateChecklistItems: jest.fn(),
      setEta: mockSetEta,
      setCashReadyCityTax: jest.fn(),
      setCashReadyDeposit: jest.fn(),
      saveRoute: mockSaveRoute,
      setPersonalization: mockSetPersonalization,
      isLoading: false,
      isError: false,
      isSuccess: true,
      errorMessage: null,
    });
  });

  it('TC-02: step navigation preserves entered data between steps', async () => {
    render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

    expect(screen.getByText('guidedFlow.step1.privacyTitle')).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: /ferry/i }));
    fireEvent.click(screen.getByRole('radio', { name: /confident/i }));
    fireEvent.click(screen.getByRole('button', { name: /saveAndContinue/i }));

    await waitFor(() => {
      expect(mockSetPersonalization).toHaveBeenCalledWith('ferry', 'confident');
    });

    const methodSelect = screen.getByLabelText('guidedFlow.step2.methodLabel') as HTMLSelectElement;
    expect(methodSelect.value).toBe('ferry');

    fireEvent.change(screen.getByLabelText('guidedFlow.step2.etaLabel'), {
      target: { value: '17:30-18:00' },
    });
    fireEvent.change(methodSelect, {
      target: { value: 'train' },
    });
    fireEvent.click(screen.getByRole('button', { name: /saveAndContinue/i }));

    await waitFor(() => {
      expect(mockSetEta).toHaveBeenCalledWith('17:30-18:00', 'train', '');
    });
  });

  it('TC-03: skip path completes flow without forcing checklist updates', async () => {
    const onComplete = jest.fn();
    render(<GuidedOnboardingFlow onComplete={onComplete} guestFirstName="Jane" />);

    fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
    fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
    fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    expect(mockUpdateChecklistItem).not.toHaveBeenCalled();
  });

  describe('OB-01: skip and abandon analytics', () => {
    it('TC-01: clicking Skip on Step 1 fires guided_step_skipped event', () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      expect(recordActivationFunnelEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'guided_step_skipped',
          stepId: 'step-1',
        }),
      );
    });

    it('TC-02: clicking Skip on Step 2 fires guided_step_skipped with step-2', async () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      // Advance to Step 2 via skip
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      (recordActivationFunnelEvent as jest.Mock).mockClear();

      // Now on Step 2 — skip it
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      expect(recordActivationFunnelEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'guided_step_skipped',
          stepId: 'step-2',
        }),
      );
    });

    it('TC-03b: clicking Skip on Step 3 fires guided_step_skipped with step-3', () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      // Advance to Step 3 via skips
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      (recordActivationFunnelEvent as jest.Mock).mockClear();

      // Now on Step 3 — skip it
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      expect(recordActivationFunnelEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'guided_step_skipped',
          stepId: 'step-3',
        }),
      );
    });

    it('TC-04: unmounting before completion fires guided_flow_abandoned', () => {
      const { unmount } = render(
        <GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />,
      );
      (recordActivationFunnelEvent as jest.Mock).mockClear();

      unmount();

      expect(recordActivationFunnelEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'guided_flow_abandoned',
          context: expect.objectContaining({ lastStep: 1 }),
        }),
      );
    });

    it('TC-05: completing flow does not fire abandoned event', async () => {
      const onComplete = jest.fn();
      const { unmount } = render(
        <GuidedOnboardingFlow onComplete={onComplete} guestFirstName="Jane" />,
      );

      // Complete the full flow via skips
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
      (recordActivationFunnelEvent as jest.Mock).mockClear();

      unmount();

      const abandonCalls = (recordActivationFunnelEvent as jest.Mock).mock.calls.filter(
        ([arg]: [{ type: string }]) => arg.type === 'guided_flow_abandoned',
      );
      expect(abandonCalls).toHaveLength(0);
    });
  });

  describe('OB-04: support/help link', () => {
    it('TC-01: Step 1 renders "Need help?" link with correct mailto href', () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      const helpLink = screen.getByRole('link', { name: /helpLink/i });
      expect(helpLink).toBeDefined();
      expect(helpLink.getAttribute('href')).toContain('mailto:hostelbrikette@gmail.com');
      expect(helpLink.getAttribute('href')).toContain('step-1');
    });

    it('TC-02: clicking help link fires utility_action_used analytics event', () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);
      (recordActivationFunnelEvent as jest.Mock).mockClear();

      fireEvent.click(screen.getByRole('link', { name: /helpLink/i }));

      expect(recordActivationFunnelEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'utility_action_used',
          context: expect.objectContaining({ surface: 'onboarding' }),
        }),
      );
    });

    it('TC-03: help link present on all 3 steps', () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      // Step 1
      expect(screen.getByRole('link', { name: /helpLink/i })).toBeDefined();

      // Advance to Step 2
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      expect(screen.getByRole('link', { name: /helpLink/i })).toBeDefined();

      // Advance to Step 3
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      expect(screen.getByRole('link', { name: /helpLink/i })).toBeDefined();
    });
  });

  describe('OB-05: skeleton loader', () => {
    it('TC-01: loading state shows skeleton elements, not spinner', () => {
      (useFetchPreArrivalData as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isError: false,
        effectiveData: {
          etaWindow: null, etaMethod: null, etaNote: '',
          etaConfirmedAt: null, cashReadyCityTax: false, cashReadyDeposit: false,
          routeSaved: null, arrivalMethodPreference: null, arrivalConfidence: null,
          checklistProgress: { routePlanned: false, etaConfirmed: false, cashPrepared: false, rulesReviewed: false, locationSaved: false },
          updatedAt: 0,
        },
        refetch: jest.fn(),
      });

      render(<GuidedOnboardingFlow onComplete={jest.fn()} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
      // No spinner should be present
      expect(screen.queryByText('animate-spin')).toBeNull();
    });

    it('TC-02: loading state shows tip message', () => {
      (useFetchPreArrivalData as jest.Mock).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isError: false,
        effectiveData: {
          etaWindow: null, etaMethod: null, etaNote: '',
          etaConfirmedAt: null, cashReadyCityTax: false, cashReadyDeposit: false,
          routeSaved: null, arrivalMethodPreference: null, arrivalConfidence: null,
          checklistProgress: { routePlanned: false, etaConfirmed: false, cashPrepared: false, rulesReviewed: false, locationSaved: false },
          updatedAt: 0,
        },
        refetch: jest.fn(),
      });

      render(<GuidedOnboardingFlow onComplete={jest.fn()} />);

      expect(screen.getByText('guidedFlow.loadingTip')).toBeDefined();
    });

    it('TC-03: non-loading state shows normal content, no skeletons', () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      expect(screen.queryAllByTestId('skeleton')).toHaveLength(0);
      expect(screen.getByText('guidedFlow.step1.privacyTitle')).toBeDefined();
    });
  });

  describe('OB-06: ARIA and focus management', () => {
    it('TC-02: navigate from Step 1 to Step 2 → Step 2 heading receives focus', async () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(document.activeElement).toBe(heading);
      });
    });

    it('TC-03: navigate from Step 2 to Step 3 → Step 3 heading receives focus', async () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      // Advance to Step 2
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      // Advance to Step 3
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(document.activeElement).toBe(heading);
      });
    });

    it('TC-04: navigate back from Step 2 to Step 1 → Step 1 heading receives focus', async () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      // Advance to Step 2
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      // Go back to Step 1
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(document.activeElement).toBe(heading);
      });
    });
  });

  describe('OB-03: error toast on API failures', () => {
    it('TC-01: setPersonalization rejects → danger toast rendered with retry action', async () => {
      mockSetPersonalization.mockRejectedValueOnce(new Error('Network error'));
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      fireEvent.click(screen.getByRole('radio', { name: /ferry/i }));
      fireEvent.click(screen.getByRole('radio', { name: /confident/i }));
      fireEvent.click(screen.getByRole('button', { name: /saveAndContinue/i }));

      await waitFor(() => {
        const toast = screen.getByTestId('error-toast');
        expect(toast).toBeDefined();
        expect(toast.getAttribute('data-variant')).toBe('danger');
        expect(screen.getByText('guidedFlow.errors.step1')).toBeDefined();
      });
    });

    it('TC-02: clicking "Try again" on error toast retries setPersonalization', async () => {
      mockSetPersonalization.mockRejectedValueOnce(new Error('Network error'));
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      fireEvent.click(screen.getByRole('radio', { name: /ferry/i }));
      fireEvent.click(screen.getByRole('radio', { name: /confident/i }));
      fireEvent.click(screen.getByRole('button', { name: /saveAndContinue/i }));

      await waitFor(() => {
        expect(screen.getByTestId('error-toast')).toBeDefined();
      });

      // Reset mock to succeed on retry
      mockSetPersonalization.mockResolvedValueOnce(undefined);
      fireEvent.click(screen.getByText('guidedFlow.errors.retry'));

      await waitFor(() => {
        expect(mockSetPersonalization).toHaveBeenCalledTimes(2);
      });
    });

    it('TC-03: setEta rejects → toast rendered; flow advances to Step 3', async () => {
      mockSetEta.mockRejectedValueOnce(new Error('Network error'));
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      // Advance to Step 2 via skip
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      // Submit Step 2
      fireEvent.click(screen.getByRole('button', { name: /saveAndContinue/i }));

      await waitFor(() => {
        const toast = screen.getByTestId('error-toast');
        expect(toast.getAttribute('data-variant')).toBe('danger');
        expect(screen.getByText('guidedFlow.errors.step2')).toBeDefined();
      });

      // Flow should have advanced to Step 3 despite error
      expect(screen.getByText('guidedFlow.step3.title')).toBeDefined();
    });

    it('TC-04: updateChecklistItem rejects → toast rendered; flow completes', async () => {
      mockUpdateChecklistItem.mockRejectedValueOnce(new Error('Network error'));
      const onComplete = jest.fn();
      render(<GuidedOnboardingFlow onComplete={onComplete} guestFirstName="Jane" />);

      // Advance to Step 3 via skips
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));
      fireEvent.click(screen.getByRole('button', { name: 'guidedFlow.skipButton' }));

      // Toggle one checklist item (cash)
      fireEvent.click(screen.getByText('guidedFlow.step3.cashTitle'));

      // Click Finish
      fireEvent.click(screen.getByRole('button', { name: /finish/i }));

      await waitFor(() => {
        const toast = screen.getByTestId('error-toast');
        expect(toast.getAttribute('data-variant')).toBe('danger');
        expect(screen.getByText('guidedFlow.errors.step3')).toBeDefined();
      });

      // Flow should still complete despite error
      expect(onComplete).toHaveBeenCalled();
    });

    it('TC-05: successful save → no error toast rendered', async () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      fireEvent.click(screen.getByRole('radio', { name: /ferry/i }));
      fireEvent.click(screen.getByRole('radio', { name: /confident/i }));
      fireEvent.click(screen.getByRole('button', { name: /saveAndContinue/i }));

      await waitFor(() => {
        expect(mockSetPersonalization).toHaveBeenCalled();
      });

      expect(screen.queryByTestId('error-toast')).toBeNull();
    });
  });

  describe('OB-02: i18n extraction', () => {
    it('TC-06: en/Onboarding.json has guidedFlow section with all required keys', () => {
      const en = require('../../../../public/locales/en/Onboarding.json');
      expect(en.guidedFlow).toBeDefined();
      expect(en.guidedFlow.step1.title).toBeDefined();
      expect(en.guidedFlow.step1.titleWithName).toContain('{{name}}');
      expect(en.guidedFlow.step2.title).toBeDefined();
      expect(en.guidedFlow.step3.title).toBeDefined();
      expect(en.guidedFlow.skipButton).toBeDefined();
      expect(en.guidedFlow.saveAndContinue).toBeDefined();
      expect(en.guidedFlow.finish).toBeDefined();
      expect(en.guidedFlow.methods.ferry).toBeDefined();
      expect(en.guidedFlow.methods.bus).toBeDefined();
      expect(en.guidedFlow.methods.train).toBeDefined();
      expect(en.guidedFlow.methods.taxi).toBeDefined();
      expect(en.guidedFlow.methods.private).toBeDefined();
      expect(en.guidedFlow.methods.other).toBeDefined();
    });

    it('TC-07: it/Onboarding.json guidedFlow section has same key structure as EN', () => {
      const en = require('../../../../public/locales/en/Onboarding.json');
      const it = require('../../../../public/locales/it/Onboarding.json');

      function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
        const keys: string[] = [];
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
          } else {
            keys.push(fullKey);
          }
        }
        return keys.sort();
      }

      const enKeys = collectKeys(en.guidedFlow);
      const itKeys = collectKeys(it.guidedFlow);
      expect(itKeys).toEqual(enKeys);
    });
  });
});
