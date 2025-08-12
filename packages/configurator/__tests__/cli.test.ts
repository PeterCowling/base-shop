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
});
