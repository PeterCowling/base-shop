import { describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "./helpers/env";
import { loadCoreEnv } from "@acme/config/env/core";

const requireEnvImport = async () => (await import("@acme/config/env/core")).requireEnv;

describe("requireEnv", () => {
  it("parses boolean, number, and string", async () => {
    await withEnv(
      { BOOL: "TRUE", NUM: "0", STR: "-12.5" },
      async () => {
        const requireEnv = await requireEnvImport();
        expect(requireEnv("BOOL", "boolean")).toBe(true);
        expect(requireEnv("NUM", "number")).toBe(0);
        expect(requireEnv("STR", "string")).toBe("-12.5");
      },
    );
  });

  it("throws on invalid values", async () => {
    await withEnv(
      { BOOL: "maybe", NUM1: "NaN", NUM2: "abc", STR: "" },
      async () => {
        const requireEnv = await requireEnvImport();
        expect(() => requireEnv("BOOL", "boolean")).toThrow(
          "BOOL must be a boolean",
        );
        expect(() => requireEnv("NUM1", "number")).toThrow(
          "NUM1 must be a number",
        );
        expect(() => requireEnv("NUM2", "number")).toThrow(
          "NUM2 must be a number",
        );
        expect(() => requireEnv("STR")).toThrow("STR is required");
      },
    );
  });
});

describe("deposit/reverse/late-fee refinement", () => {
  it("coerces valid values", () => {
    const env = loadCoreEnv({
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "true",
      REVERSE_LOGISTICS_INTERVAL_MS: "1000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "250",
    } as any);
    expect(env.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
    expect(env.REVERSE_LOGISTICS_ENABLED).toBe(true);
    expect(env.REVERSE_LOGISTICS_INTERVAL_MS).toBe(1000);
    expect(env.LATE_FEE_ENABLED).toBe(true);
    expect(env.LATE_FEE_INTERVAL_MS).toBe(250);
  });

  it("reports invalid booleans and numbers", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        DEPOSIT_RELEASE_ENABLED: "maybe",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
        REVERSE_LOGISTICS_ENABLED: "nope",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
        LATE_FEE_ENABLED: "perhaps",
        LATE_FEE_INTERVAL_MS: "eventually",
      } as any),
    ).toThrow("Invalid core environment variables");
    const output = err.mock.calls.flat().join("\n");
    expect(output).toContain("DEPOSIT_RELEASE_ENABLED: must be true or false");
    expect(output).toContain(
      "DEPOSIT_RELEASE_INTERVAL_MS: must be a number",
    );
    expect(output).toContain(
      "REVERSE_LOGISTICS_ENABLED: must be true or false",
    );
    expect(output).toContain(
      "REVERSE_LOGISTICS_INTERVAL_MS: must be a number",
    );
    expect(output).toContain("LATE_FEE_ENABLED: must be true or false");
    expect(output).toContain("LATE_FEE_INTERVAL_MS: must be a number");
    err.mockRestore();
  });
});

describe("invalid URL", () => {
  it("fails when NEXT_PUBLIC_BASE_URL is invalid", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({ NEXT_PUBLIC_BASE_URL: "not a url" } as any),
    ).toThrow("Invalid core environment variables");
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});


describe("nested schema errors", () => {
  it("bubbles up auth and email issues", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        AUTH_PROVIDER: "jwt",
        EMAIL_PROVIDER: "sendgrid",
      } as any),
    ).toThrow("Invalid core environment variables");
    const output = err.mock.calls.flat().join("\n");
    expect(output).toContain("JWT_SECRET is required when AUTH_PROVIDER=jwt");
    expect(output).toContain("SENDGRID_API_KEY: Required");
    err.mockRestore();
  });
});

describe("coreEnv proxy traps", () => {
  it("proxies property access and reflection", async () => {
    await withEnv(
      { CMS_SPACE_URL: "https://example.com", CMS_ACCESS_TOKEN: "tok" },
      async () => {
        const { coreEnv } = await import("@acme/config/env/core");
        expect(coreEnv.CMS_SPACE_URL).toBe("https://example.com");
        expect("CMS_SPACE_URL" in coreEnv).toBe(true);
        expect(Object.keys(coreEnv)).toEqual(
          expect.arrayContaining(["CMS_SPACE_URL", "CMS_ACCESS_TOKEN"]),
        );
        const desc = Object.getOwnPropertyDescriptor(
          coreEnv,
          "CMS_SPACE_URL",
        );
        expect(desc?.value).toBe("https://example.com");
      },
    );
  });
});

describe("coreEnv caching", () => {
  it("reuses parsed env until modules reset", async () => {
    await withEnv(
      { CMS_SPACE_URL: "https://one.example", CMS_ACCESS_TOKEN: "a" },
      async () => {
        const mod = await import("@acme/config/env/core");
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://one.example");
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://one.example");
      },
    );

    await withEnv(
      { CMS_SPACE_URL: "https://two.example", CMS_ACCESS_TOKEN: "b" },
      async () => {
        const mod = await import("@acme/config/env/core");
        expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://two.example");
      },
    );
  });
});
