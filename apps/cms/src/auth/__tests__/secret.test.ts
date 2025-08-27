import { afterEach, describe, expect, it, jest } from "@jest/globals";

const OLD_ENV = { ...process.env };

afterEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});

describe("auth secret", () => {
  it("throws when NEXTAUTH_SECRET is missing", async () => {
    delete (process.env as Record<string, string | undefined>).NEXTAUTH_SECRET;
    jest.doMock("@acme/config", () => ({ env: process.env }));
    await expect(import("../secret")).rejects.toThrow(
      "NEXTAUTH_SECRET is not set",
    );
  });

  it("throws when NEXTAUTH_SECRET is empty", async () => {
    (process.env as Record<string, string>).NEXTAUTH_SECRET = "";
    jest.doMock("@acme/config", () => ({ env: process.env }));
    await expect(import("../secret")).rejects.toThrow(
      "NEXTAUTH_SECRET is not set",
    );
  });

  it("exports the NEXTAUTH_SECRET value", async () => {
    (process.env as Record<string, string>).NEXTAUTH_SECRET = "test-secret";
    jest.doMock("@acme/config", () => ({ env: process.env }));
    const { authSecret } = await import("../secret");
    expect(authSecret).toBe("test-secret");
  });
});

