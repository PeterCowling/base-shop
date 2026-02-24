import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePinAuth } from '../../../contexts/messaging/PinAuthProvider';
import DirectTelemetryPanel from '../DirectTelemetryPanel';

jest.mock('../../../contexts/messaging/PinAuthProvider', () => ({
  usePinAuth: jest.fn(),
}));

const mockedUsePinAuth = usePinAuth as jest.MockedFunction<typeof usePinAuth>;

describe('DirectTelemetryPanel', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not fetch telemetry without staff token', () => {
    mockedUsePinAuth.mockReturnValue({
      user: null,
      role: null,
      claims: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      authError: null,
      lockout: null,
      login: async () => false,
      logout: () => {},
    });

    render(<DirectTelemetryPanel />);

    expect(screen.getByText('Staff sign-in is required to view telemetry totals.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches and renders direct telemetry metrics for staff', async () => {
    mockedUsePinAuth.mockReturnValue({
      user: { id: 'staff_1' },
      role: 'staff',
      claims: null,
      authToken: 'staff-token-123',
      isAuthenticated: true,
      isLoading: false,
      authError: null,
      lockout: null,
      login: async () => true,
      logout: () => {},
    });

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          generatedAt: '2026-02-24T12:00:00.000Z',
          windowDays: 7,
          dayBuckets: ['2026-02-23', '2026-02-24'],
          totals: {
            'write.success': 9,
            'write.denied_not_confirmed_guests': 3,
            'write.rate_limited': 1,
            'read.success': 12,
            'read.rate_limited': 2,
          },
          byDay: {
            '2026-02-23': {
              'write.success': 4,
            },
            '2026-02-24': {
              'write.success': 5,
            },
          },
        }),
        { status: 200 },
      ),
    );

    render(<DirectTelemetryPanel />);

    await waitFor(() => {
      expect(screen.getByText('Messages delivered')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/direct-telemetry?days=14', {
      headers: {
        Authorization: 'Bearer staff-token-123',
      },
    });
    expect(screen.getByText('Blocked: non-confirmed guests')).toBeInTheDocument();
    expect(screen.getByText(/Non-confirmed guest block rate:/)).toBeInTheDocument();
    expect(screen.getByText(/\(0\/9 write attempts\)/)).toBeInTheDocument();
    expect(screen.getByLabelText('Write success trend sparkline')).toBeInTheDocument();
  });

  it('shows error message when telemetry endpoint fails', async () => {
    mockedUsePinAuth.mockReturnValue({
      user: { id: 'staff_2' },
      role: 'staff',
      claims: null,
      authToken: 'staff-token-123',
      isAuthenticated: true,
      isLoading: false,
      authError: null,
      lockout: null,
      login: async () => true,
      logout: () => {},
    });

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ error: 'internal' }), { status: 500 }),
    );

    render(<DirectTelemetryPanel />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to load direct-message telemetry right now.'),
      ).toBeInTheDocument();
    });
  });

  it('refetches telemetry when changing the window selector', async () => {
    const user = userEvent.setup();
    mockedUsePinAuth.mockReturnValue({
      user: { id: 'staff_3' },
      role: 'staff',
      claims: null,
      authToken: 'staff-token-123',
      isAuthenticated: true,
      isLoading: false,
      authError: null,
      lockout: null,
      login: async () => true,
      logout: () => {},
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generatedAt: '2026-02-24T12:00:00.000Z',
            windowDays: 7,
            dayBuckets: ['2026-02-24'],
            totals: { 'write.success': 2 },
            byDay: { '2026-02-24': { 'write.success': 2 } },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generatedAt: '2026-02-24T12:05:00.000Z',
            windowDays: 14,
            dayBuckets: ['2026-02-23', '2026-02-24'],
            totals: { 'write.success': 5 },
            byDay: {
              '2026-02-23': { 'write.success': 2 },
              '2026-02-24': { 'write.success': 3 },
            },
          }),
          { status: 200 },
        ),
      );

    render(<DirectTelemetryPanel />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/direct-telemetry?days=14', {
        headers: {
          Authorization: 'Bearer staff-token-123',
        },
      });
    });

    await user.click(screen.getByRole('button', { name: '14d' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/direct-telemetry?days=28', {
        headers: {
          Authorization: 'Bearer staff-token-123',
        },
      });
    });
  });

  it('renders previous-window comparison badges and warning states', async () => {
    mockedUsePinAuth.mockReturnValue({
      user: { id: 'staff_4' },
      role: 'staff',
      claims: null,
      authToken: 'staff-token-123',
      isAuthenticated: true,
      isLoading: false,
      authError: null,
      lockout: null,
      login: async () => true,
      logout: () => {},
    });

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          generatedAt: '2026-02-24T12:00:00.000Z',
          windowDays: 14,
          dayBuckets: [
            '2026-02-11',
            '2026-02-12',
            '2026-02-13',
            '2026-02-14',
            '2026-02-15',
            '2026-02-16',
            '2026-02-17',
            '2026-02-18',
            '2026-02-19',
            '2026-02-20',
            '2026-02-21',
            '2026-02-22',
            '2026-02-23',
            '2026-02-24',
          ],
          totals: {},
          byDay: {
            '2026-02-11': { 'write.success': 5, 'write.rate_limited': 1, 'write.denied_not_confirmed_guests': 1, 'read.success': 8 },
            '2026-02-12': { 'write.success': 5, 'write.rate_limited': 1, 'write.denied_not_confirmed_guests': 1, 'read.success': 8 },
            '2026-02-13': { 'write.success': 5, 'write.rate_limited': 1, 'write.denied_not_confirmed_guests': 1, 'read.success': 8 },
            '2026-02-14': { 'write.success': 5, 'write.rate_limited': 1, 'write.denied_not_confirmed_guests': 1, 'read.success': 8 },
            '2026-02-15': { 'write.success': 5, 'write.rate_limited': 1, 'write.denied_not_confirmed_guests': 1, 'read.success': 8 },
            '2026-02-16': { 'write.success': 5, 'write.rate_limited': 1, 'write.denied_not_confirmed_guests': 1, 'read.success': 8 },
            '2026-02-17': { 'write.success': 5, 'write.rate_limited': 1, 'write.denied_not_confirmed_guests': 1, 'read.success': 8 },
            '2026-02-18': { 'write.success': 3, 'write.rate_limited': 3, 'write.denied_not_confirmed_guests': 2, 'read.success': 6 },
            '2026-02-19': { 'write.success': 3, 'write.rate_limited': 3, 'write.denied_not_confirmed_guests': 2, 'read.success': 6 },
            '2026-02-20': { 'write.success': 3, 'write.rate_limited': 3, 'write.denied_not_confirmed_guests': 2, 'read.success': 6 },
            '2026-02-21': { 'write.success': 3, 'write.rate_limited': 3, 'write.denied_not_confirmed_guests': 2, 'read.success': 6 },
            '2026-02-22': { 'write.success': 3, 'write.rate_limited': 3, 'write.denied_not_confirmed_guests': 2, 'read.success': 6 },
            '2026-02-23': { 'write.success': 3, 'write.rate_limited': 3, 'write.denied_not_confirmed_guests': 2, 'read.success': 6 },
            '2026-02-24': { 'write.success': 3, 'write.rate_limited': 3, 'write.denied_not_confirmed_guests': 2, 'read.success': 6 },
          },
        }),
        { status: 200 },
      ),
    );

    render(<DirectTelemetryPanel />);

    await waitFor(() => {
      expect(screen.getByText('Compared with previous window')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Write rate limited/).length).toBeGreaterThan(0);
    expect(screen.getByText(/up \(\+200%\): 21 vs 7/)).toBeInTheDocument();
    expect(screen.getAllByText(/Messages delivered/).length).toBeGreaterThan(0);
    expect(screen.getByText(/down \(-40%\): 21 vs 35/)).toBeInTheDocument();
    expect(screen.getByText('Badge thresholds')).toBeInTheDocument();
    expect(screen.getByText('Write rate limited up 20% or more.')).toBeInTheDocument();
  });
});
