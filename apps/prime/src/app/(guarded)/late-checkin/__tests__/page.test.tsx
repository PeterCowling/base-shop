import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import LateCheckInPage from '../page';

const mockUseUnifiedBookingData = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: () => mockUseUnifiedBookingData(),
}));

describe('LateCheckInPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        checkOutDate: '2099-02-12',
      },
      isLoading: false,
      error: null,
    });
  });

  it('TC-01: renders step-by-step late check-in guidance and quick links', () => {
    render(<LateCheckInPage />);

    expect(screen.getByText('lateCheckin.steps.step1')).toBeInTheDocument();
    expect(screen.getByText('lateCheckin.priorityNotice')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'lateCheckin.mainDoorCta' }),
    ).toHaveAttribute('href', '/main-door-access');
    expect(
      screen.getByRole('link', { name: 'lateCheckin.issuesCta' }),
    ).toHaveAttribute('href', '/overnight-issues');
  });

  it('TC-02: renders load error when booking context is unavailable', () => {
    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: null,
      isLoading: false,
      error: new Error('failed'),
    });

    render(<LateCheckInPage />);

    expect(screen.getByText('lateCheckin.loadError')).toBeInTheDocument();
  });

  it('TC-03: renders loading state while booking context is loading', () => {
    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: null,
      isLoading: true,
      error: null,
    });

    const { container } = render(<LateCheckInPage />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
