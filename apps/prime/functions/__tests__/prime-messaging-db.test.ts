/**
 * @jest-environment node
 */

import type { D1Database, D1PreparedStatement } from '@acme/platform-core/d1';

import { getPrimeMessagingDb, hasPrimeMessagingDb } from '../lib/prime-messaging-db';

function createMockDb(): D1Database {
  const statement: D1PreparedStatement = {
    bind: () => statement,
    all: async () => ({ results: [] }),
    first: async () => null,
    run: async () => ({ success: true }),
  };

  return {
    prepare: () => statement,
    batch: async () => [],
  };
}

describe('prime-messaging-db', () => {
  it('returns the configured binding when present', () => {
    const db = createMockDb();

    expect(getPrimeMessagingDb({ PRIME_MESSAGING_DB: db })).toBe(db);
    expect(hasPrimeMessagingDb({ PRIME_MESSAGING_DB: db })).toBe(true);
  });

  it('throws a guidance error when the binding is missing', () => {
    expect(() => getPrimeMessagingDb({})).toThrow(/PRIME_MESSAGING_DB binding missing/);
    expect(hasPrimeMessagingDb({})).toBe(false);
  });
});
