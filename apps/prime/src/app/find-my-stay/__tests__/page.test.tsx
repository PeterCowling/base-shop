import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import FindMyStayPage from '../page';

// Mock react-i18next using actual FindMyStay locale so translation strings match test expectations
jest.mock('react-i18next', () => {
  const en = require('../../../../public/locales/en/FindMyStay.json');
  function flatten(obj: Record<string, unknown>, prefix?: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === 'object') {
        Object.assign(result, flatten(v as Record<string, unknown>, full));
      } else {
        result[full] = String(v);
      }
    }
    return result;
  }
  const lookup = flatten(en);
  return {
    useTranslation: () => ({
      t: (key: string, opts?: Record<string, unknown>) => {
        let value = lookup[key] ?? key;
        if (opts) {
          for (const [k, v] of Object.entries(opts)) {
            value = value.replace(`{{${k}}}`, String(v));
          }
        }
        return value;
      },
      i18n: { language: 'en', changeLanguage: jest.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: jest.fn() },
  };
});

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
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Booking code'), { target: { value: 'BDC-123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find my stay' }));
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
