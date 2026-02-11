/**
 * @jest-environment node
 */

import {
  enforceStaffAuthTokenGate,
  type StaffAuthTokenGateEnv,
} from '../lib/staff-auth-token-gate';

function createBaseEnv(
  overrides: Partial<StaffAuthTokenGateEnv> = {},
): StaffAuthTokenGateEnv {
  return {
    NODE_ENV: 'production',
    PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
    CF_FIREBASE_API_KEY: 'firebase-api-key',
    ...overrides,
  };
}

describe('staff auth token gate spike', () => {
  it('TC-01: valid staff token/claims passes gate', async () => {
    const verifyStaffTokenClaims = jest.fn(async () => ({
      uid: 'staff_user_1',
      role: 'admin',
      hostelId: 'prime',
    }));

    const result = await enforceStaffAuthTokenGate(
      new Request('https://prime.example.com/api/check-in-lookup', {
        headers: {
          Authorization: 'Bearer staff-token-123',
        },
      }),
      createBaseEnv(),
      { verifyStaffTokenClaims },
    );

    expect(result.ok).toBe(true);
    expect(verifyStaffTokenClaims).toHaveBeenCalledWith(
      'staff-token-123',
      expect.objectContaining({
        NODE_ENV: 'production',
        PRIME_ENABLE_STAFF_OWNER_ROUTES: 'true',
      }),
    );

    if (result.ok) {
      expect(result.identity).toEqual({
        uid: 'staff_user_1',
        role: 'admin',
        claims: {
          uid: 'staff_user_1',
          role: 'admin',
          hostelId: 'prime',
        },
      });
    }
  });

  it('TC-02: missing token fails gate', async () => {
    const result = await enforceStaffAuthTokenGate(
      new Request('https://prime.example.com/api/check-in-lookup'),
      createBaseEnv(),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        error: 'Missing Authorization bearer token',
      });
    }
  });

  it('TC-03: non-staff token/claims fails gate', async () => {
    const verifyStaffTokenClaims = jest.fn(async () => ({
      uid: 'guest_1',
      role: 'guest',
    }));

    const result = await enforceStaffAuthTokenGate(
      new Request('https://prime.example.com/api/check-in-lookup', {
        headers: {
          Authorization: 'Bearer guest-token-123',
        },
      }),
      createBaseEnv(),
      { verifyStaffTokenClaims },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        error: 'Staff role claim is required',
      });
    }
  });

  it('TC-04: feature-disabled production path remains deny-by-default', async () => {
    const verifyStaffTokenClaims = jest.fn(async () => ({
      uid: 'staff_user_1',
      role: 'staff',
    }));

    const result = await enforceStaffAuthTokenGate(
      new Request('https://prime.example.com/api/check-in-lookup', {
        headers: {
          Authorization: 'Bearer staff-token-123',
        },
      }),
      createBaseEnv({
        PRIME_ENABLE_STAFF_OWNER_ROUTES: 'false',
      }),
      { verifyStaffTokenClaims },
    );

    expect(result.ok).toBe(false);
    expect(verifyStaffTokenClaims).not.toHaveBeenCalled();

    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        error: 'Staff/owner APIs are disabled in production until secure route gates are enabled.',
      });
    }
  });
});
