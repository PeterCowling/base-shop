/**
 * @jest-environment node
 */

import { hashPin } from '../../src/utils/pinSecurity';
import { onRequestPost } from '../api/staff-auth-session';

import { createMockEnv, createMockKv, createPagesContext } from './helpers';

async function createServiceAccountTestKeyPair(): Promise<{ email: string; privateKeyPem: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );

  const exported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const base64 = Buffer.from(exported).toString('base64');
  const lines = base64.match(/.{1,64}/g) ?? [];
  const privateKeyPem = [
    '-----BEGIN PRIVATE KEY-----',
    ...lines,
    '-----END PRIVATE KEY-----',
  ].join('\n');

  return {
    email: 'prime-staff-auth@test.iam.gserviceaccount.com',
    privateKeyPem,
  };
}

describe('/api/staff-auth-session', () => {
  it('TC-01: valid staff PIN hash comparison returns authenticated session payload with role claims', async () => {
    const kv = createMockKv();
    const pinHash = await hashPin('2468');
    const serviceAccount = await createServiceAccountTestKeyPair();

    const response = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-auth-session',
        method: 'POST',
        headers: { 'CF-Connecting-IP': '10.0.0.99' },
        body: { pin: '2468' },
        env: createMockEnv({
          RATE_LIMIT: kv,
          PRIME_STAFF_PIN_HASH: pinHash,
          PRIME_STAFF_AUTH_UID: 'staff_operator_1',
          PRIME_STAFF_AUTH_ROLE: 'admin',
          PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL: serviceAccount.email,
          PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY: serviceAccount.privateKeyPem,
        }),
      }),
    );

    const payload = await response.json() as {
      customToken: string;
      uid: string;
      role: string;
      claims: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(payload.uid).toBe('staff_operator_1');
    expect(payload.role).toBe('admin');
    expect(payload.claims).toEqual({
      role: 'admin',
      roles: ['admin'],
      staff: true,
      hostelId: 'prime',
    });
    expect(payload.customToken.split('.')).toHaveLength(3);
  });

  it('TC-02: invalid PIN attempt returns deterministic failure and preserves lockout counters', async () => {
    const kv = createMockKv();
    const pinHash = await hashPin('2468');
    const serviceAccount = await createServiceAccountTestKeyPair();

    const env = createMockEnv({
      RATE_LIMIT: kv,
      PRIME_STAFF_PIN_HASH: pinHash,
      PRIME_STAFF_AUTH_UID: 'staff_operator_1',
      PRIME_STAFF_AUTH_ROLE: 'staff',
      PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL: serviceAccount.email,
      PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY: serviceAccount.privateKeyPem,
      PRIME_STAFF_LOCKOUT_MAX_ATTEMPTS: '5',
    });

    const firstResponse = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-auth-session',
        method: 'POST',
        headers: { 'CF-Connecting-IP': '10.0.0.100' },
        body: { pin: '0000' },
        env,
      }),
    );
    const firstPayload = await firstResponse.json() as {
      error: string;
      failedAttempts: number;
      attemptsRemaining: number;
      lockedUntil: number | null;
    };

    const secondResponse = await onRequestPost(
      createPagesContext({
        url: 'https://prime.example.com/api/staff-auth-session',
        method: 'POST',
        headers: { 'CF-Connecting-IP': '10.0.0.100' },
        body: { pin: '0000' },
        env,
      }),
    );
    const secondPayload = await secondResponse.json() as {
      error: string;
      failedAttempts: number;
      attemptsRemaining: number;
      lockedUntil: number | null;
    };

    expect(firstResponse.status).toBe(401);
    expect(firstPayload).toMatchObject({
      error: 'Invalid PIN',
      failedAttempts: 1,
      attemptsRemaining: 4,
      lockedUntil: null,
    });

    expect(secondResponse.status).toBe(401);
    expect(secondPayload).toMatchObject({
      error: 'Invalid PIN',
      failedAttempts: 2,
      attemptsRemaining: 3,
      lockedUntil: null,
    });

    expect(kv.put).toHaveBeenCalled();
  });
});
