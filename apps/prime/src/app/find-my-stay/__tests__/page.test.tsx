import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FindMyStayPage from '../page';

describe('FindMyStayPage', () => {
  const fetchMock = jest.fn();
  const assignMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    Object.defineProperty(window, 'location', {
      value: { assign: assignMock },
      writable: true,
      configurable: true,
    });
  });

  function fillFormAndSubmit() {
    fireEvent.change(screen.getByLabelText('Surname'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Booking Reference'), { target: { value: 'BDC-123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find Booking' }));
  }

  it('TC-01: redirects guest to API-provided redirectUrl', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ redirectUrl: '/g/token-abc123' }),
    });

    render(<FindMyStayPage />);
    fillFormAndSubmit();

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/g/token-abc123');
    });
  });

  it('TC-02: shows lookup errors for 404 and 429 responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<FindMyStayPage />);
    fillFormAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Booking not found. Please check your details.')).toBeDefined();
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    fillFormAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Too many attempts. Please try again later.')).toBeDefined();
    });
  });

  it('TC-03: shows deterministic error when API omits redirectUrl', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<FindMyStayPage />);
    fillFormAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByText('We found your booking, but could not open your guest link. Please try again.'),
      ).toBeDefined();
    });
    expect(assignMock).not.toHaveBeenCalled();
  });
});
