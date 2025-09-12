import { describe, it, expect } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";
import { NEXT_SECRET, SESSION_SECRET } from "./authEnvTestUtils";

describe("strongSecret validation", () => {
  const base = {
    NODE_ENV: "production",
    SESSION_SECRET,
  } as const;

  it("rejects secrets shorter than 32 characters", async () => {
    await expect(
      withEnv(
        { ...base, NEXTAUTH_SECRET: "short" },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("rejects secrets with non-printable characters", async () => {
    await expect(
      withEnv(
        { ...base, NEXTAUTH_SECRET: `${"a".repeat(31)}\n` },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("rejects session secret shorter than 32 characters", async () => {
    await expect(
      withEnv(
        { ...base, NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET: "short" },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("rejects session secret with non-printable characters", async () => {
    await expect(
      withEnv(
        {
          ...base,
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: `${"a".repeat(31)}\n`,
        },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });
});
