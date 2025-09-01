// scripts/__tests__/quickstart-shop.test.ts

const execSync = jest.fn();

jest.mock("node:child_process", () => ({
  execSync,
  spawnSync: jest.fn(),
}));

jest.mock("@acme/platform-core/createShop", () => ({
  createShop: jest.fn(),
  loadBaseTokens: jest.fn(),
}));
jest.mock("@acme/platform-core/shops", () => ({
  validateShopName: jest.fn(),
}));
jest.mock("@acme/platform-core/configurator", () => ({
  validateShopEnv: jest.fn(),
  readEnvFile: jest.fn(),
}));
jest.mock("@acme/platform-core/createShop/listProviders", () => ({
  listProviders: jest.fn(),
}));
jest.mock("../src/seedShop", () => ({ seedShop: jest.fn() }));
jest.mock("../src/generate-theme", () => ({
  generateThemeTokens: jest.fn(),
}));
jest.mock("../src/apply-page-template", () => ({
  applyPageTemplate: jest.fn(),
}));

describe("ensureRuntime", () => {
  const ORIGINAL_VERSION = process.version;

  beforeEach(() => {
    jest.resetModules();
    execSync.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(process, "version", {
      value: ORIGINAL_VERSION,
      configurable: true,
    });
    jest.restoreAllMocks();
  });

  it("exits when Node.js version is below 20", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as never);

    execSync.mockReturnValue("10.0.0");
    Object.defineProperty(process, "version", {
      value: "v18.0.0",
      configurable: true,
    });

    const { ensureRuntime } = await import("../src/quickstart-shop.ts");

    expect(() => ensureRuntime()).toThrow("EXIT:1");
    expect(errorSpy).toHaveBeenCalledWith(
      "Node.js v20 or later is required. Current version: v18.0.0"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits when pnpm version is below 10", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as never);

    execSync.mockReturnValue("8.0.0");
    Object.defineProperty(process, "version", {
      value: "v20.0.0",
      configurable: true,
    });

    const { ensureRuntime } = await import("../src/quickstart-shop.ts");

    expect(() => ensureRuntime()).toThrow("EXIT:1");
    expect(errorSpy).toHaveBeenCalledWith(
      "pnpm v10 or later is required. Current version: 8.0.0"
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("does nothing when requirements are met", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as never);

    execSync.mockReturnValue("10.1.0");
    Object.defineProperty(process, "version", {
      value: "v20.1.0",
      configurable: true,
    });

    const { ensureRuntime } = await import("../src/quickstart-shop.ts");

    expect(() => ensureRuntime()).not.toThrow();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

