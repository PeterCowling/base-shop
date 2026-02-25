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
    expect(
      screen.getByRole('link', { name: 'overnightIssues.assistantCta' }),
    ).toHaveAttribute('href', '/digital-assistant');
    expect(screen.getByText('overnightIssues.priorityNotice')).toBeInTheDocument();
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

  it('TC-03: renders loading spinner while booking context loads', () => {
    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: null,
      isLoading: true,
      error: null,
    });

    const { container } = render(<OvernightIssuesPage />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('TC-04: uses fallback email content when booking reference is unavailable', () => {
    mockUseUnifiedBookingData.mockReturnValue({
      occupantData: {},
      isLoading: false,
      error: null,
    });

    render(<OvernightIssuesPage />);

    const reportLink = screen.getByRole('link', {
      name: 'overnightIssues.emailCta',
    });
    const href = reportLink.getAttribute('href') ?? '';
    expect(href).toContain('subject=Overnight+issue+-+Prime+app');
    expect(href).toContain('Booking%3A+Unknown');
  });
});
