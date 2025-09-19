/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

async function importCore() {
  return await import("../../core.ts");
}

describe("core reload behavior", () => {
  it("reloads after jest.resetModules with updated env", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      CMS_SPACE_URL: "https://first.example.com",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod1 = await importCore();
    expect(mod1.coreEnv.CMS_SPACE_URL).toBe("https://first.example.com");

    process.env = {
      ...ORIGINAL_ENV,
      CMS_SPACE_URL: "https://second.example.com",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod2 = await importCore();
    expect(mod2.coreEnv.CMS_SPACE_URL).toBe("https://second.example.com");
  });
});

