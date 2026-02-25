import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import MainDoorAccessPage from '../page';

const mockUseUnifiedBookingData = jest.fn();
const mockUseCheckInCode = jest.fn();
const clipboardWriteTextMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: () => mockUseUnifiedBookingData(),
}));

jest.mock('../../../../hooks/useCheckInCode', () => ({
  __esModule: true,
  default: (args: unknown) => mockUseCheckInCode(args),
}));

describe('MainDoorAccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText: clipboardWriteTextMock },
      configurable: true,
    });

    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        checkOutDate: '2099-02-12',
      },
      isLoading: false,
      error: null,
    });

    mockUseCheckInCode.mockReturnValue({
      code: 'BRK-ABCDE',
      isLoading: false,
      isError: false,
      errorMessage: null,
      isStale: false,
      isOffline: false,
      refetch: jest.fn(),
      generateCode: jest.fn(),
    });
  });

  it('TC-01: renders door code and copies it to clipboard', async () => {
    clipboardWriteTextMock.mockResolvedValue(undefined);

    render(<MainDoorAccessPage />);

    fireEvent.click(screen.getByRole('button', { name: /BRK-ABCDE/i }));

    await waitFor(() => {
      expect(clipboardWriteTextMock).toHaveBeenCalledWith('BRK-ABCDE');
    });
  });

  it('TC-02: renders booking-load error state when occupant data is unavailable', () => {
    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: null,
      isLoading: false,
      error: new Error('failed'),
    });

    render(<MainDoorAccessPage />);

    expect(screen.getByText('mainDoor.loadError')).toBeInTheDocument();
  });

  it('TC-03: renders stale-code warning banner when cached code is shown', () => {
    mockUseCheckInCode.mockReturnValue({
      code: 'BRK-ABCDE',
      isLoading: false,
      isError: false,
      errorMessage: null,
      isStale: true,
      isOffline: false,
      refetch: jest.fn(),
      generateCode: jest.fn(),
    });

    render(<MainDoorAccessPage />);

    expect(screen.getByText('mainDoor.staleWarning')).toBeInTheDocument();
  });

  it('TC-04: renders offline/no-cache warning when offline and no code exists', () => {
    mockUseCheckInCode.mockReturnValue({
      code: null,
      isLoading: false,
      isError: false,
      errorMessage: null,
      isStale: false,
      isOffline: true,
      refetch: jest.fn(),
      generateCode: jest.fn(),
    });

    render(<MainDoorAccessPage />);

    expect(screen.getByText('mainDoor.offlineNoCode')).toBeInTheDocument();
  });

  it('TC-05: refreshes code when refresh button is pressed', () => {
    const refetchMock = jest.fn();
    mockUseCheckInCode.mockReturnValue({
      code: null,
      isLoading: false,
      isError: false,
      errorMessage: null,
      isStale: false,
      isOffline: false,
      refetch: refetchMock,
      generateCode: jest.fn(),
    });

    render(<MainDoorAccessPage />);

    fireEvent.click(screen.getByRole('button', { name: 'mainDoor.refreshCode' }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});
