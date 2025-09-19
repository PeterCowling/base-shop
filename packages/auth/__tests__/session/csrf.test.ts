import {
  importSessionModule,
  resetSessionMocks,
  restoreEnv,
  sessionMocks,
} from "./testUtils";

describe("validateCsrfToken", () => {
  afterAll(() => {
    restoreEnv();
  });

  beforeEach(() => {
    resetSessionMocks();
  });

  it("returns true when the token matches the cookie", async () => {
    const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CSRF_TOKEN_COOKIE, "csrf");

    await expect(validateCsrfToken("csrf")).resolves.toBe(true);
  });

  it("returns false when the token mismatches", async () => {
    const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CSRF_TOKEN_COOKIE, "csrf");

    await expect(validateCsrfToken("other")).resolves.toBe(false);
  });

  it("returns false when the csrf cookie is missing", async () => {
    const { validateCsrfToken } = await importSessionModule();

    await expect(validateCsrfToken("csrf")).resolves.toBe(false);
  });

  it("returns false when the supplied token is null", async () => {
    const { validateCsrfToken } = await importSessionModule();

    await expect(validateCsrfToken(null)).resolves.toBe(false);
  });

  it("returns false when the supplied token is empty", async () => {
    const { validateCsrfToken, CSRF_TOKEN_COOKIE } = await importSessionModule();

    sessionMocks.cookies.jar.set(CSRF_TOKEN_COOKIE, "csrf");

    await expect(validateCsrfToken("")).resolves.toBe(false);
  });
});
