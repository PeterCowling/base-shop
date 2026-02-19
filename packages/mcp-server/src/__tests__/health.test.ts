/** @jest-environment node */

import { runEmailSystemPreflight } from "../tools/health";

describe("email startup preflight (TASK-11)", () => {
  it("TC-11-01: missing env var is surfaced with explicit variable name", async () => {
    const result = await runEmailSystemPreflight({
      strict: false,
      env: {
        FIREBASE_DATABASE_URL: "https://firebase.example",
        FIREBASE_API_KEY: "firebase-key",
        OCTORATE_USERNAME: "operator@example.com",
        OCTORATE_PASSWORD: "secret",
      },
      cwd: "/tmp/base-shop",
      fileExists: (filePath) => !filePath.endsWith("storage-state.json"),
      gmailStatus: {
        hasCredentials: true,
        hasToken: true,
        credentialsPath: "/tmp/base-shop/credentials.json",
        tokenPath: "/tmp/base-shop/token.json",
      },
      databaseProbe: async () => ({
        status: "fail",
        detail: "Missing env var: DATABASE_URL",
        remediation: "Set DATABASE_URL.",
      }),
    });

    const databaseEnvCheck = result.checks.find(
      (check) => check.key === "database_url"
    );

    expect(databaseEnvCheck).toBeDefined();
    expect(databaseEnvCheck?.status).toBe("fail");
    expect(databaseEnvCheck?.detail).toContain("DATABASE_URL");
  });

  it("TC-11-02: missing Octorate storage state reports expected path", async () => {
    const expectedPath = "/tmp/base-shop/.secrets/octorate/storage-state.json";
    const result = await runEmailSystemPreflight({
      strict: false,
      env: {
        DATABASE_URL: "postgresql://localhost/base_shop",
        FIREBASE_DATABASE_URL: "https://firebase.example",
        FIREBASE_API_KEY: "firebase-key",
        OCTORATE_USERNAME: "operator@example.com",
        OCTORATE_PASSWORD: "secret",
      },
      cwd: "/tmp/base-shop",
      fileExists: () => false,
      gmailStatus: {
        hasCredentials: true,
        hasToken: true,
        credentialsPath: "/tmp/base-shop/credentials.json",
        tokenPath: "/tmp/base-shop/token.json",
      },
      databaseProbe: async () => ({
        status: "ok",
        detail: "Database probe query succeeded.",
        remediation: "No action required.",
      }),
    });

    const storageCheck = result.checks.find(
      (check) => check.key === "octorate_storage_state"
    );

    expect(storageCheck).toBeDefined();
    expect(storageCheck?.status).toBe("fail");
    expect(storageCheck?.detail).toContain(expectedPath);
    expect(storageCheck?.remediation).toContain("octorate_login_interactive");
  });

  it("TC-11-03: all dependencies configured returns pass summary", async () => {
    const result = await runEmailSystemPreflight({
      strict: false,
      env: {
        DATABASE_URL: "postgresql://localhost/base_shop",
        FIREBASE_DATABASE_URL: "https://firebase.example",
        FIREBASE_API_KEY: "firebase-key",
        OCTORATE_USERNAME: "operator@example.com",
        OCTORATE_PASSWORD: "secret",
      },
      cwd: "/tmp/base-shop",
      fileExists: () => true,
      gmailStatus: {
        hasCredentials: true,
        hasToken: true,
        credentialsPath: "/tmp/base-shop/credentials.json",
        tokenPath: "/tmp/base-shop/token.json",
      },
      databaseProbe: async () => ({
        status: "ok",
        detail: "Database probe query succeeded.",
        remediation: "No action required.",
      }),
    });

    expect(result.status).toBe("pass");
    expect(result.totals.fail).toBe(0);
    expect(result.checks.every((check) => check.status === "ok")).toBe(true);
  });
});
