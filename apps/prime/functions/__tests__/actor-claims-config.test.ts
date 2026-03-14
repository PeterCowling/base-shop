/**
 * @jest-environment node
 *
 * prime-outbound-auth-hardening: TASK-06
 * Unit tests for validatePrimeActorClaimsConfig.
 *
 * TC-01: PRIME_ACTOR_CLAIMS_SECRET absent → { valid: false, reason: 'missing' } (warns, not throws in non-prod)
 * TC-02: Secret length < 32 → { valid: false, reason: 'too-short' }
 * TC-03: Secret equals gateway token → { valid: false, reason: 'same-as-gateway-token' }
 * TC-04: Valid distinct secret ≥ 32 chars → { valid: true }
 * TC-05: In production mode, absent secret → throws
 * TC-06: In production mode, too-short secret → throws
 * TC-07: In production mode, same-as-gateway-token → throws
 * TC-08: Gateway token absent (only PRIME_ACTOR_CLAIMS_SECRET set) → { valid: true }
 */

import { validatePrimeActorClaimsConfig } from '../lib/actor-claims-resolver';

const VALID_SECRET = 'test-actor-claims-secret-32chars!!';
const VALID_TOKEN = 'test-gateway-token-different-32!!';

describe('validatePrimeActorClaimsConfig (TASK-06)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('non-production mode (warns, does not throw)', () => {
    it('TC-01: absent secret → { valid: false, reason: missing } + console.warn', () => {
      const result = validatePrimeActorClaimsConfig({});
      expect(result).toEqual({ valid: false, reason: 'missing' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/not set/);
    });

    it('TC-02: secret too short → { valid: false, reason: too-short } + console.warn', () => {
      const result = validatePrimeActorClaimsConfig({
        PRIME_ACTOR_CLAIMS_SECRET: 'short',
      });
      expect(result).toEqual({ valid: false, reason: 'too-short' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/too short/);
    });

    it('TC-03: secret equals gateway token → { valid: false, reason: same-as-gateway-token } + console.warn', () => {
      const sharedValue = VALID_SECRET;
      const result = validatePrimeActorClaimsConfig({
        PRIME_ACTOR_CLAIMS_SECRET: sharedValue,
        PRIME_STAFF_OWNER_GATE_TOKEN: sharedValue,
      });
      expect(result).toEqual({ valid: false, reason: 'same-as-gateway-token' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/must not equal/);
    });

    it('TC-04: valid distinct secret ≥ 32 chars → { valid: true } + no warning', () => {
      const result = validatePrimeActorClaimsConfig({
        PRIME_ACTOR_CLAIMS_SECRET: VALID_SECRET,
        PRIME_STAFF_OWNER_GATE_TOKEN: VALID_TOKEN,
      });
      expect(result).toEqual({ valid: true });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('TC-08: gateway token absent → { valid: true } when secret is valid', () => {
      const result = validatePrimeActorClaimsConfig({
        PRIME_ACTOR_CLAIMS_SECRET: VALID_SECRET,
      });
      expect(result).toEqual({ valid: true });
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('production mode (throws on misconfiguration)', () => {
    it('TC-05: absent secret → throws in production mode', () => {
      expect(() => validatePrimeActorClaimsConfig({}, true)).toThrow(/not set/);
    });

    it('TC-06: too-short secret → throws in production mode', () => {
      expect(() =>
        validatePrimeActorClaimsConfig({ PRIME_ACTOR_CLAIMS_SECRET: 'short' }, true),
      ).toThrow(/too short/);
    });

    it('TC-07: secret equals gateway token → throws in production mode', () => {
      const sharedValue = VALID_SECRET;
      expect(() =>
        validatePrimeActorClaimsConfig(
          {
            PRIME_ACTOR_CLAIMS_SECRET: sharedValue,
            PRIME_STAFF_OWNER_GATE_TOKEN: sharedValue,
          },
          true,
        ),
      ).toThrow(/must not equal/);
    });

    it('valid config in production → does not throw', () => {
      expect(() =>
        validatePrimeActorClaimsConfig(
          {
            PRIME_ACTOR_CLAIMS_SECRET: VALID_SECRET,
            PRIME_STAFF_OWNER_GATE_TOKEN: VALID_TOKEN,
          },
          true,
        ),
      ).not.toThrow();
    });
  });

  describe('NODE_ENV-based production detection', () => {
    it('NODE_ENV=production + absent secret → throws', () => {
      expect(() =>
        validatePrimeActorClaimsConfig({ NODE_ENV: 'production' }),
      ).toThrow(/not set/);
    });

    it('NODE_ENV=development + absent secret → warns, does not throw', () => {
      const result = validatePrimeActorClaimsConfig({ NODE_ENV: 'development' });
      expect(result).toEqual({ valid: false, reason: 'missing' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
