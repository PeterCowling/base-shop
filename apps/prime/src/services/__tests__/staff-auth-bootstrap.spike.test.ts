import { isStaffRole } from '../../lib/checkin/helpers';
import {
  bootstrapStaffAuthSession,
  getTask51PromotionRecommendation,
} from '../staffAuthBootstrap';

function createBootstrapDependencies(claims?: Record<string, unknown>) {
  return {
    signInWithCustomToken: jest.fn(async () => ({
      user: {
        uid: 'staff-user-1',
        getIdToken: async () => 'firebase-id-token-123',
        getIdTokenResult: async () => ({ claims }),
      },
    })),
  };
}

describe('staff auth bootstrap spike', () => {
  it('TC-01: auth bootstrap initializes and yields expected claim shape', async () => {
    const dependencies = createBootstrapDependencies({
      role: 'staff',
      hostelId: 'prime',
    });

    const result = await bootstrapStaffAuthSession('custom-token-123', dependencies);

    expect(dependencies.signInWithCustomToken).toHaveBeenCalledWith('custom-token-123');
    expect(result).toEqual({
      ok: true,
      userId: 'staff-user-1',
      idToken: 'firebase-id-token-123',
      role: 'staff',
      claims: {
        role: 'staff',
        hostelId: 'prime',
      },
    });
  });

  it('TC-02a: missing claims path fails closed', async () => {
    const dependencies = createBootstrapDependencies(undefined);

    const result = await bootstrapStaffAuthSession('custom-token-123', dependencies);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_claims');
      expect(getTask51PromotionRecommendation(result)).toBe('BLOCK_TASK_51_UNTIL_MISSING_CLAIMS');
    }
  });

  it('TC-02b: invalid role claim path fails closed', async () => {
    const dependencies = createBootstrapDependencies({
      role: 'guest',
    });

    const result = await bootstrapStaffAuthSession('custom-token-123', dependencies);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_role_claim');
      expect(getTask51PromotionRecommendation(result)).toBe('BLOCK_TASK_51_UNTIL_INVALID_ROLE_CLAIM');
    }
  });

  it('TC-03: staff-role claim path unlocks guarded-staff consumer checks', async () => {
    const dependencies = createBootstrapDependencies({
      roles: ['owner', 'staff'],
    });

    const result = await bootstrapStaffAuthSession('custom-token-123', dependencies);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.role).toBe('owner');
      expect(isStaffRole(result.role)).toBe(true);
      expect(getTask51PromotionRecommendation(result)).toBe(
        'PROMOTE_TASK_51_WITH_FIREBASE_BOOTSTRAP',
      );
    }
  });
});
