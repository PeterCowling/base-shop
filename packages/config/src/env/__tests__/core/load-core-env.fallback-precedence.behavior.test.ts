/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import { loadCoreEnv } from "../../core.ts";

describe("loadCoreEnv fallback precedence", () => {
  const base = {
    CMS_SPACE_URL: "https://cms.example.com",
    SANITY_API_VERSION: "v1",
  };

  it("prefers process.env over .env defaults over code defaults", () => {
    const dotenvDefaults = { CMS_ACCESS_TOKEN: "from-dotenv" };
    const explicit = { CMS_ACCESS_TOKEN: "from-process" };

    const withCodeDefault = loadCoreEnv({ ...base } as NodeJS.ProcessEnv);
    expect(withCodeDefault.CMS_ACCESS_TOKEN).toBe("placeholder-token");

    const withDotenv = loadCoreEnv({
      ...dotenvDefaults,
      ...base,
    } as NodeJS.ProcessEnv);
    expect(withDotenv.CMS_ACCESS_TOKEN).toBe("from-dotenv");

    const withProcess = loadCoreEnv({
      ...dotenvDefaults,
      ...explicit,
      ...base,
    } as NodeJS.ProcessEnv);
    expect(withProcess.CMS_ACCESS_TOKEN).toBe("from-process");
  });
});

