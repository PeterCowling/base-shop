/**
 * D1 Binding Helpers Tests
 *
 * Unit tests for D1 binding access functions.
 * Uses fake globalThis bindings (no Cloudflare runtime required).
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

import {
  getBusinessOsDb,
  getD1FromGlobalThis,
  hasBusinessOsDb,
  type BusinessOsEnv,
} from "../getBindings.server";
import type { D1Database, D1PreparedStatement } from "../types";

describe("getBusinessOsDb", () => {
  it("returns D1Database when binding is present", () => {
    const mockDb: D1Database = {
      prepare: () => ({} as D1PreparedStatement),
      batch: async () => [],
    };

    const env: BusinessOsEnv = {
      BUSINESS_OS_DB: mockDb,
    };

    const result = getBusinessOsDb(env);

    expect(result).toBe(mockDb);
  });

  it("throws clear error when binding is missing", () => {
    const env: BusinessOsEnv = {};

    expect(() => getBusinessOsDb(env)).toThrow(
      "BUSINESS_OS_DB binding missing"
    );
  });

  it("error message includes configuration hints", () => {
    const env: BusinessOsEnv = {};

    expect(() => getBusinessOsDb(env)).toThrow(/wrangler.toml/);
    expect(() => getBusinessOsDb(env)).toThrow(/Cloudflare runtime/);
  });

  it("accepts env with additional properties", () => {
    const mockDb: D1Database = {
      prepare: () => ({} as D1PreparedStatement),
      batch: async () => [],
    };

    const env: BusinessOsEnv = {
      BUSINESS_OS_DB: mockDb,
      SESSION_SECRET: "test-secret",
      BUSINESS_OS_AUTH_ENABLED: "true",
      SOME_OTHER_BINDING: "value",
    };

    const result = getBusinessOsDb(env);

    expect(result).toBe(mockDb);
  });
});

describe("getD1FromGlobalThis", () => {
  beforeEach(() => {
    // Clean up any existing bindings
    delete (globalThis as Record<string, unknown>).BUSINESS_OS_DB;
    delete (globalThis as Record<string, unknown>).OTHER_DB;
  });

  afterEach(() => {
    // Clean up test bindings
    delete (globalThis as Record<string, unknown>).BUSINESS_OS_DB;
    delete (globalThis as Record<string, unknown>).OTHER_DB;
  });

  it("returns D1Database when binding exists on globalThis", () => {
    const mockDb: D1Database = {
      prepare: () => ({} as D1PreparedStatement),
      batch: async () => [],
    };

    (globalThis as Record<string, unknown>).BUSINESS_OS_DB = mockDb;

    const result = getD1FromGlobalThis("BUSINESS_OS_DB");

    expect(result).toBe(mockDb);
  });

  it("returns null when binding is missing", () => {
    const result = getD1FromGlobalThis("BUSINESS_OS_DB");

    expect(result).toBeNull();
  });

  it("uses default binding name BUSINESS_OS_DB", () => {
    const mockDb: D1Database = {
      prepare: () => ({} as D1PreparedStatement),
      batch: async () => [],
    };

    (globalThis as Record<string, unknown>).BUSINESS_OS_DB = mockDb;

    const result = getD1FromGlobalThis();

    expect(result).toBe(mockDb);
  });

  it("supports custom binding names", () => {
    const mockDb: D1Database = {
      prepare: () => ({} as D1PreparedStatement),
      batch: async () => [],
    };

    (globalThis as Record<string, unknown>).OTHER_DB = mockDb;

    const result = getD1FromGlobalThis("OTHER_DB");

    expect(result).toBe(mockDb);
  });

  it("does not throw when binding is missing", () => {
    expect(() => getD1FromGlobalThis("NONEXISTENT")).not.toThrow();
  });
});

describe("hasBusinessOsDb", () => {
  it("returns true when binding is present", () => {
    const mockDb: D1Database = {
      prepare: () => ({} as D1PreparedStatement),
      batch: async () => [],
    };

    const env: BusinessOsEnv = {
      BUSINESS_OS_DB: mockDb,
    };

    expect(hasBusinessOsDb(env)).toBe(true);
  });

  it("returns false when binding is missing", () => {
    const env: BusinessOsEnv = {};

    expect(hasBusinessOsDb(env)).toBe(false);
  });

  it("returns false when binding is undefined", () => {
    const env: BusinessOsEnv = {
      BUSINESS_OS_DB: undefined,
    };

    expect(hasBusinessOsDb(env)).toBe(false);
  });

  it("returns false when binding is null", () => {
    const env: BusinessOsEnv = {
      BUSINESS_OS_DB: null as unknown as D1Database,
    };

    expect(hasBusinessOsDb(env)).toBe(false);
  });

  it("does not throw for any env object", () => {
    expect(() => hasBusinessOsDb({})).not.toThrow();
    expect(() => hasBusinessOsDb({ BUSINESS_OS_DB: undefined })).not.toThrow();
    expect(() =>
      hasBusinessOsDb({ BUSINESS_OS_DB: null as unknown as D1Database })
    ).not.toThrow();
  });
});

describe("D1Database type compatibility", () => {
  it("accepts objects with prepare and batch methods", () => {
    const mockDb: D1Database = {
      prepare: (query: string) => {
        // Mock implementation
        return {
          bind: (..._args: unknown[]) => ({} as D1PreparedStatement),
          all: async () => ({ results: [] }),
          first: async () => null,
          run: async () => ({ success: true }),
        } as D1PreparedStatement;
      },
      batch: async (_statements: D1PreparedStatement[]) => {
        return [];
      },
    };

    const env: BusinessOsEnv = {
      BUSINESS_OS_DB: mockDb,
    };

    // Should not throw
    const db = getBusinessOsDb(env);
    expect(db).toBeDefined();
    expect(typeof db.prepare).toBe("function");
    expect(typeof db.batch).toBe("function");
  });

  it("supports optional methods (dump, exec)", () => {
    const mockDb: D1Database = {
      prepare: () => ({} as D1PreparedStatement),
      batch: async () => [],
      dump: async () => new ArrayBuffer(0),
      exec: async () => ({ count: 0, duration: 0 }),
    };

    const env: BusinessOsEnv = {
      BUSINESS_OS_DB: mockDb,
    };

    const db = getBusinessOsDb(env);
    expect(db.dump).toBeDefined();
    expect(db.exec).toBeDefined();
  });
});
