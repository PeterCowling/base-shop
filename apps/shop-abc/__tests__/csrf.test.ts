// apps/shop-abc/__tests__/csrf.test.ts
import { CSRF_TOKEN_COOKIE, validateCsrfToken } from "../../../packages/auth/src/session";

const jar = new Map<string, string>();

jest.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) =>
      jar.has(name) ? { value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  }),
}));

describe("validateCsrfToken", () => {
  beforeEach(() => {
    jar.clear();
  });

  it("accepts matching token", async () => {
    jar.set(CSRF_TOKEN_COOKIE, "abc");
    await expect(validateCsrfToken("abc")).resolves.toBe(true);
  });

  it("rejects missing or mismatched token", async () => {
    jar.set(CSRF_TOKEN_COOKIE, "abc");
    await expect(validateCsrfToken("wrong")).resolves.toBe(false);
    await expect(validateCsrfToken(null)).resolves.toBe(false);
  });
});
