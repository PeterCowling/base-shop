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

    expect(screen.getByText('Privacy reassurance')).toBeDefined();

    fireEvent.click(screen.getByRole('radio', { name: /Ferry/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Confident/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save and continue/i }));

    await waitFor(() => {
      expect(mockSetPersonalization).toHaveBeenCalledWith('ferry', 'confident');
    });

    const methodSelect = screen.getByLabelText('Travel method') as HTMLSelectElement;
    expect(methodSelect.value).toBe('ferry');

    fireEvent.change(screen.getByLabelText('Arrival time window'), {
      target: { value: '17:30-18:00' },
    });
    fireEvent.change(methodSelect, {
      target: { value: 'train' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save and continue/i }));

    await waitFor(() => {
      expect(mockSetEta).toHaveBeenCalledWith('17:30-18:00', 'train', '');
    });
  });

  it('TC-03: skip path completes flow without forcing checklist updates', async () => {
    const onComplete = jest.fn();
    render(<GuidedOnboardingFlow onComplete={onComplete} guestFirstName="Jane" />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    expect(mockUpdateChecklistItem).not.toHaveBeenCalled();
  });

  describe('OB-01: skip and abandon analytics', () => {
    it('TC-01: clicking Skip on Step 1 fires guided_step_skipped event', () => {
      render(<GuidedOnboardingFlow onComplete={jest.fn()} guestFirstName="Jane" />);

      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

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
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
      (recordActivationFunnelEvent as jest.Mock).mockClear();

      // Now on Step 2 — skip it
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

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
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
      (recordActivationFunnelEvent as jest.Mock).mockClear();

      // Now on Step 3 — skip it
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

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
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

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
});
