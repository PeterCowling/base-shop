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
      if (key === 'prime_guest_token') return ' token-123 ';
      if (key === 'prime_guest_booking_id') return 'BOOK123';
      if (key === 'prime_guest_uuid') return 'occ_1234567890123';
      if (key === 'prime_guest_first_name') return 'Jane';
      if (key === 'prime_guest_verified_at') return '2026-02-07T00:00:00.000Z';
      return null;
    });

    const session = readGuestSession(storage);

    expect(session).toEqual({
      token: 'token-123',
      bookingId: 'BOOK123',
      uuid: 'occ_1234567890123',
      firstName: 'Jane',
      verifiedAt: '2026-02-07T00:00:00.000Z',
    });
    expect(buildGuestHomeUrl(session)).toBe('/?uuid=occ_1234567890123');
  });

  it('clears all guest session storage keys', () => {
    clearGuestSession(storage);

    expect(storage.removeItem).toHaveBeenCalledTimes(5);
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_token');
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_booking_id');
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_uuid');
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_first_name');
    expect(storage.removeItem).toHaveBeenCalledWith('prime_guest_verified_at');
  });

  it('returns validation states for token verification calls', async () => {
    const okFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const expiredFetch = jest.fn().mockResolvedValue({ ok: false, status: 410 });
    const invalidFetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const networkFetch = jest.fn().mockRejectedValue(new Error('offline'));

    await expect(validateGuestToken('token-a', okFetch)).resolves.toBe('valid');
    await expect(validateGuestToken('token-b', expiredFetch)).resolves.toBe('expired');
    await expect(validateGuestToken('token-c', invalidFetch)).resolves.toBe('invalid');
    await expect(validateGuestToken('token-d', networkFetch)).resolves.toBe('network_error');
  });
});
