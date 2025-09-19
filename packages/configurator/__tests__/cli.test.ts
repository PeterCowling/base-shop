const spawnSyncMock = jest.fn();

jest.mock("node:child_process", () => ({
  spawnSync: (...args: unknown[]) => spawnSyncMock(...args),
}));

describe("configurator CLI", () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    spawnSyncMock.mockReset();
    exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {}) as any);

    process.env.STRIPE_SECRET_KEY = "sk";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
    process.env.CART_COOKIE_SECRET = "secret";
    process.env.NEXTAUTH_SECRET = "a".repeat(32);
    process.env.SESSION_SECRET = "b".repeat(32);
    process.env.CMS_SPACE_URL = "https://cms.example.com";
    process.env.CMS_ACCESS_TOKEN = "cms-token";
    process.env.SANITY_PROJECT_ID = "project";
    process.env.SANITY_DATASET = "dataset";
    process.env.SANITY_API_TOKEN = "sanity-token";
    process.env.SANITY_PREVIEW_SECRET = "preview-secret";
    process.env.EMAIL_PROVIDER = "noop";
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  async function run(cmd: string) {
    process.argv = ["node", "configurator", cmd];
    await import("../src/index");
  }

  it.each([
    ["dev", "vite", ["dev"]],
    ["build", "vite", ["build"]],
    ["deploy", "wrangler", ["pages", "deploy", ".vercel/output/static"]],
  ])("runs %s command", async (cmd, bin, args) => {
    spawnSyncMock.mockReturnValue({ status: 0 });
    await run(cmd as string);
    expect(spawnSyncMock).toHaveBeenCalledWith(bin, args, {
      stdio: "inherit",
      shell: true,
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exits with command's status when run fails", async () => {
    spawnSyncMock.mockReturnValue({ status: 2 });
    await run("dev");
    expect(exitSpy).toHaveBeenCalledWith(2);
    expect(spawnSyncMock).toHaveBeenCalledTimes(1);
  });

  it("defaults to exit code 1 when status is undefined", async () => {
    spawnSyncMock.mockReturnValue({ status: undefined });
    await run("dev");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(spawnSyncMock).toHaveBeenCalledTimes(1);
  });

  it("exits with code 1 when spawn fails", async () => {
    const error = new Error("fail");
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    spawnSyncMock.mockReturnValue({ status: null, error });

    await run("dev");

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(spawnSyncMock).toHaveBeenCalledTimes(1);

    if (errorSpy.mock.calls.length > 0) {
      expect(errorSpy).toHaveBeenCalledWith(error);
    }

    errorSpy.mockRestore();
  });

  it("prints usage for unknown command", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await run("foo");

    expect(spawnSyncMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "Usage: pnpm configurator <dev|build|deploy>"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    logSpy.mockRestore();
  });

  it("prints usage when no command is provided", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    process.argv = ["node", "configurator"];
    await import("../src/index");

    expect(spawnSyncMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "Usage: pnpm configurator <dev|build|deploy>"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);

    logSpy.mockRestore();
  });

  it("exits when required env vars are missing", async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    await import("@acme/config/env");
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.CART_COOKIE_SECRET;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    exitSpy.mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as any);

    try {
      await run("dev");
    } catch {
      // ignore mocked exit error
    }

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(spawnSyncMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:\n",
      expect.anything()
    );
    errorSpy.mockRestore();
    process.env.NODE_ENV = prevNodeEnv;
  });
});
