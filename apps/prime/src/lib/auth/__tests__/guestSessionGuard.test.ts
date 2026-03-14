import {
  buildGuestHomeUrl,
  clearGuestSession,
  readGuestSession,
  validateGuestToken,
} from '../guestSessionGuard';

describe('guestSessionGuard', () => {
  const storage = {
    getItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads and normalizes guest session values from storage', () => {
    storage.getItem.mockImplementation((key: string) => {
      if (key === 'prime_guest_booking_id') return 'BOOK123';
      if (key === 'prime_guest_uuid') return 'occ_1234567890123';
      if (key === 'prime_guest_first_name') return 'Jane';
      if (key === 'prime_guest_verified_at') return '2026-02-07T00:00:00.000Z';
      return null;
    });

    const session = readGuestSession(storage);

    expect(session).toEqual({
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    expect(buildGuestHomeUrl(session)).toBe('/?uuid=occ_1234567890123');
  });

  it('clears all guest session storage keys', () => {
    clearGuestSession(storage);

    expect(storage.removeItem).toHaveBeenCalledTimes(4);
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_booking_id');
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_uuid');
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_first_name');
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_verified_at');
  });

  it('returns validation states for token verification calls', async () => {
    const okFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'ok', expiresAt: '2026-12-31T00:00:00.000Z', guestUuid: 'occ_1234567890123' }),
    });
    const expiredFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: jest.fn().mockResolvedValue({}),
    });
    const invalidFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({}),
    });
    const networkFetch = jest.fn().mockRejectedValue(new Error('offline'));

    await expect(validateGuestToken(okFetch)).resolves.toEqual({ status: 'valid', guestUuid: 'occ_1234567890123' });
    await expect(validateGuestToken(expiredFetch)).resolves.toEqual({ status: 'expired', guestUuid: null });
    await expect(validateGuestToken(invalidFetch)).resolves.toEqual({ status: 'invalid', guestUuid: null });
    await expect(validateGuestToken(networkFetch)).resolves.toEqual({ status: 'network_error', guestUuid: null });
  });
});
