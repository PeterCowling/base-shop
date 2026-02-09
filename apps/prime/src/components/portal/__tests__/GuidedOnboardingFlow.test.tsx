import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { usePreArrivalMutator } from '../../../hooks/mutator/usePreArrivalMutator';
import { useFetchPreArrivalData } from '../../../hooks/pureData/useFetchPreArrivalData';
import GuidedOnboardingFlow from '../GuidedOnboardingFlow';

jest.mock('../../../hooks/mutator/usePreArrivalMutator', () => ({
  usePreArrivalMutator: jest.fn(),
}));

jest.mock('../../../hooks/pureData/useFetchPreArrivalData', () => ({
  useFetchPreArrivalData: jest.fn(),
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

    fireEvent.click(screen.getByRole('button', { name: 'ferry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confident' }));
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
    fireEvent.click(screen.getByRole('button', { name: /Save ETA/i }));

    await waitFor(() => {
      expect(mockSetEta).toHaveBeenCalledWith('17:30-18:00', 'train', '');
    });
  });

  it('TC-03: skip path completes flow without forcing checklist updates', async () => {
    const onComplete = jest.fn();
    render(<GuidedOnboardingFlow onComplete={onComplete} guestFirstName="Jane" />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip to dashboard' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
    expect(mockUpdateChecklistItem).not.toHaveBeenCalled();
  });
});
