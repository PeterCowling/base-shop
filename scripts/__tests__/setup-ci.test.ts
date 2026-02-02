// scripts/__tests__/setup-ci.test.ts
import path from "node:path";

import fs from "fs";

jest.mock("@config/src/env", () => ({
  envSchema: { parse: jest.fn() },
}));

describe("setup-ci script", () => {
  const ORIGINAL_ARGV = process.argv;

  const findWorkflowWrite = (writeMock: jest.SpyInstance) =>
    writeMock.mock.calls.find(([wfPath]) =>
      wfPath === path.join(".github", "workflows", "cover-me-pretty.yml")
    );

  beforeEach(() => {
    jest.resetModules();
    process.argv = [...ORIGINAL_ARGV];
  });

  afterEach(() => {
    process.argv = ORIGINAL_ARGV;
    jest.restoreAllMocks();
  });

  it("writes workflow using provided shop id", async () => {
    const { envSchema } = await import("@config/src/env");
    (envSchema.parse as jest.Mock).mockReturnValue({});

    const env = [
      "STRIPE_SECRET_KEY=sk",
      "STRIPE_WEBHOOK_SECRET=whsec",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk",
    ].join("\n");
    const existsMock = jest
      .spyOn(fs, "existsSync")
      .mockImplementation((p) => p.toString().endsWith(".env"));
    const readMock = jest
      .spyOn(fs, "readFileSync")
      .mockImplementation((p) => (p.toString().endsWith(".env") ? env : "{}"));
    const writeMock = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation(() => {});
    const exitMock = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as never);

    process.argv = ["node", "setup-ci", "bcd"];

    await import("../src/setup-ci");

    expect(existsMock).toHaveBeenCalled();
    expect(readMock).toHaveBeenCalled();
    const workflowCall = findWorkflowWrite(writeMock);
    expect(workflowCall).toBeDefined();
    const [, content] = workflowCall as [string, string];
    expect(content).toContain("uses: ./.github/workflows/reusable-app.yml");
    expect(content).toContain('app-filter: "@apps/cover-me-pretty"');
    expect(content).toContain(
      'build-cmd: "pnpm --filter @apps/cover-me-pretty... build"'
    );
    expect(content).toContain(
      "pnpm exec next-on-pages deploy --project-name cover-me-pretty --branch ${{ github.ref_name }}"
    );
    expect(content).toContain('project-name: "cover-me-pretty"');
    expect(content).not.toContain("STRIPE_SECRET_KEY");
    expect(exitMock).not.toHaveBeenCalled();
  });

  it("includes path filters for the app and packages", async () => {
    const { envSchema } = await import("@config/src/env");
    (envSchema.parse as jest.Mock).mockReturnValue({});

    const env = [
      "STRIPE_SECRET_KEY=sk",
      "STRIPE_WEBHOOK_SECRET=whsec",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk",
    ].join("\n");
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockImplementation((p) =>
      p.toString().endsWith(".env") ? env : "{}"
    );
    const writeMock = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation(() => {});

    process.argv = ["node", "setup-ci", "bcd"];

    await import("../src/setup-ci");

    const workflowCall = findWorkflowWrite(writeMock);
    expect(workflowCall).toBeDefined();
    const [, content] = workflowCall as [string, string];
    expect(content).toContain("apps/cover-me-pretty/**");
    expect(content).toContain("packages/**");
    expect(content).toContain(".github/workflows/cover-me-pretty.yml");
  });

  it("fails when env file is missing", async () => {
    const { envSchema } = await import("@config/src/env");
    (envSchema.parse as jest.Mock).mockReturnValue({});

    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const writeMock = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitMock = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as never);

    process.argv = ["node", "setup-ci", "bcd"];

    await expect(import("../src/setup-ci")).rejects.toThrow("EXIT:1");
    expect(errorSpy).toHaveBeenCalledWith(
      `Missing ${path.join("apps", "cover-me-pretty", ".env")}`
    );
    expect(findWorkflowWrite(writeMock)).toBeUndefined();
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it("fails with invalid env vars", async () => {
    const { envSchema } = await import("@config/src/env");
    (envSchema.parse as jest.Mock).mockImplementation(() => {
      throw new Error("bad env");
    });

    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "readFileSync").mockReturnValue("STRIPE_SECRET_KEY=sk");
    const writeMock = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitMock = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as never);

    process.argv = ["node", "setup-ci", "bcd"];

    await expect(import("../src/setup-ci")).rejects.toThrow("EXIT:1");
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain("Invalid environment variables");
    expect(findWorkflowWrite(writeMock)).toBeUndefined();
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
