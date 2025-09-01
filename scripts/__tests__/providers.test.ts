import { pluginEnvVars } from "@acme/platform-core/configurator";

jest.mock("node:fs", () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const fsMock = require("node:fs") as {
  readdirSync: jest.Mock;
  readFileSync: jest.Mock;
};
const { listPlugins } = require("../src/utils/providers");

describe("listPlugins", () => {
  beforeEach(() => {
    fsMock.readdirSync.mockReset();
    fsMock.readFileSync.mockReset();
  });

  it("returns plugin metadata with env vars even when package.json is missing", () => {
    const dirent = (name: string) => ({ name, isDirectory: () => true });
    fsMock.readdirSync.mockReturnValue([dirent("stripe"), dirent("paypal")]);
    fsMock.readFileSync.mockImplementation((p: string) => {
      if (p.includes("stripe")) {
        return JSON.stringify({ name: "@acme/stripe-plugin" });
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    const plugins = listPlugins("/root");
    expect(plugins).toEqual([
      { id: "stripe", packageName: "@acme/stripe-plugin", envVars: pluginEnvVars.stripe },
      { id: "paypal", packageName: undefined, envVars: pluginEnvVars.paypal },
    ]);
  });

  it("falls back gracefully when plugins directory cannot be read", () => {
    fsMock.readdirSync.mockImplementation(() => {
      throw new Error("boom");
    });
    expect(listPlugins("/root")).toEqual([]);
  });
});
