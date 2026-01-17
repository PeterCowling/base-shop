import { listPlugins } from "../src/utils/providers";
import { pluginEnvVars } from "@acme/platform-core/configurator";
import * as fs from "node:fs";

jest.mock("node:fs", () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

const fsMock = jest.mocked(fs);

describe("listPlugins", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      {
        id: "stripe",
        packageName: "@acme/stripe-plugin",
        envVars: pluginEnvVars.stripe,
      },
      {
        id: "paypal",
        packageName: undefined,
        envVars: pluginEnvVars.paypal,
      },
    ]);
  });

  it("falls back gracefully when plugins directory cannot be read", () => {
    fsMock.readdirSync.mockImplementation(() => {
      throw new Error("boom");
    });

    expect(listPlugins("/root")).toEqual([]);
  });
});
