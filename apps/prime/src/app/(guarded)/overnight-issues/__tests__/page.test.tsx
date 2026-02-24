import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import OvernightIssuesPage from '../page';

const mockUseUnifiedBookingData = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      if (key === 'overnightIssues.email.subjectWithBooking') {
        return `Overnight issue - Booking ${options?.bookingRef ?? ''}`;
      }
      if (key === 'overnightIssues.email.bodyTemplate') {
        return `Booking: ${options?.bookingRef ?? ''}`;
      }
      if (key === 'overnightIssues.email.subjectDefault') {
        return 'Overnight issue - Prime app';
      }
      if (key === 'overnightIssues.email.unknownBookingRef') {
        return 'Unknown';
      }
      return key;
    },
  }),
}));

jest.mock('../../../../hooks/dataOrchestrator/useUnifiedBookingData', () => ({
  useUnifiedBookingData: () => mockUseUnifiedBookingData(),
}));

describe('OvernightIssuesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: {
        reservationCode: 'BRK123',
      },
      isLoading: false,
      error: null,
    });
  });

  it('TC-01: renders support actions and report-email link with booking reference', () => {
    render(<OvernightIssuesPage />);

    const reportLink = screen.getByRole('link', {
      name: 'overnightIssues.emailCta',
    });
    expect(reportLink).toHaveAttribute('href');
    expect(reportLink.getAttribute('href')).toContain(
      'mailto:hostelbrikette@gmail.com',
    );
    expect(reportLink.getAttribute('href')).toContain('BRK123');
  });

  it('TC-02: renders load error when booking context is unavailable', () => {
    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: null,
      isLoading: false,
      error: new Error('failed'),
    });

    render(<OvernightIssuesPage />);

    expect(screen.getByText('overnightIssues.loadError')).toBeInTheDocument();
  });
});
