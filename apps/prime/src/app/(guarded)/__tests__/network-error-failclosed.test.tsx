import { validateGuestToken } from '../../../lib/auth/guestSessionGuard';
import { evaluateSdkAccess } from '../../../lib/security/dataAccessModel';

jest.mock('../../../lib/auth/guestSessionGuard', () => ({
  ...jest.requireActual('../../../lib/auth/guestSessionGuard'),
  validateGuestToken: jest.fn(),
}));

const mockValidateGuestToken = validateGuestToken as jest.MockedFunction<typeof validateGuestToken>;

describe('network_error fail-closed policy', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('TC-01: network_error from validateGuestToken does not grant access', async () => {
    mockValidateGuestToken.mockResolvedValue('network_error');

    const result = await validateGuestToken('some-token');

    // network_error must never be treated as 'valid' by callers
    expect(result).toBe('network_error');
    expect(result === 'valid').toBe(false);
  });

  it('TC-02: only valid grants access — expired is denied', async () => {
    mockValidateGuestToken.mockResolvedValue('expired');

    const result = await validateGuestToken('some-token');

    expect(result).not.toBe('valid');
  });

  it('TC-03: only valid grants access — invalid is denied', async () => {
    mockValidateGuestToken.mockResolvedValue('invalid');

    const result = await validateGuestToken('some-token');

    expect(result).not.toBe('valid');
  });

  it('TC-04: sdk access model unaffected — missing guest token fails closed', () => {
    const decision = evaluateSdkAccess('activities_presence', {
      hasGuestToken: false,
      isGuestAuthReady: true,
      flowFlagEnabled: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('missing-guest-token');
  });
});
