import path from "node:path";

import { pluginEnvVars } from "../src/configurator";
import { defaultPaymentProviders } from "../src/createShop/defaultPaymentProviders";
import { defaultShippingProviders } from "../src/createShop/defaultShippingProviders";

const moduleId = (folder: string) => `virtual:${folder}`;

type DirLike = { name: string; isDirectory: () => boolean };

const dir = (name: string, isDirectory = true): DirLike => ({
  name,
  isDirectory: () => isDirectory,
});

describe("listProviders", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("returns built-in providers when the plugins directory is missing", async () => {
    const readdir = jest.fn().mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    jest.doMock("fs/promises", () => ({ readdir }));

    const { default: listProviders } = await import("../src/createShop/listProviders");

    const providers = await listProviders("payment");

    expect(readdir).toHaveBeenCalled();
    expect(providers).toEqual(
      defaultPaymentProviders.map((id) => ({
        id,
        name: id,
        envVars: pluginEnvVars[id] ?? [],
      })),
    );
  });

  it("merges plugin providers, handles duplicates, and falls back to directory names", async () => {
    const pluginEntries: DirLike[] = [
      dir("custom-plugin"),
      dir("nameless"),
      dir("duplicate-payment"),
      dir("duplicate-shipping"),
      dir("broken"),
      dir("readme.md", false),
    ];
    const readdir = jest.fn().mockResolvedValue(pluginEntries);
    jest.doMock("fs/promises", () => ({ readdir }));

    jest.doMock("url", () => ({
      pathToFileURL: (filePath: string) => ({
        href: moduleId(path.basename(path.dirname(filePath))),
      }),
    }));

    jest.doMock(
      moduleId("custom-plugin"),
      () => ({
        __esModule: true,
        default: {
          id: "custom-plugin",
          name: "Custom Plugin",
          registerPayments() {
            return undefined;
          },
          registerShipping() {
            return undefined;
          },
        },
      }),
      { virtual: true },
    );

    jest.doMock(
      moduleId("nameless"),
      () => ({
        __esModule: true,
        default: {
          registerPayments() {
            return undefined;
          },
        },
      }),
      { virtual: true },
    );

    jest.doMock(
      moduleId("duplicate-payment"),
      () => ({
        __esModule: true,
        default: {
          id: "stripe",
          registerPayments() {
            return undefined;
          },
        },
      }),
      { virtual: true },
    );

    jest.doMock(
      moduleId("duplicate-shipping"),
      () => ({
        __esModule: true,
        default: {
          id: "dhl",
          registerShipping() {
            return undefined;
          },
        },
      }),
      { virtual: true },
    );

    const { default: listProviders } = await import("../src/createShop/listProviders");

    const payments = await listProviders("payment");
    const shipping = await listProviders("shipping");

    const sortById = (items: { id: string }[]) =>
      [...items].sort((a, b) => a.id.localeCompare(b.id));

    expect(sortById(payments)).toEqual([
      {
        id: "custom-plugin",
        name: "Custom Plugin",
        envVars: [],
      },
      {
        id: "nameless",
        name: "nameless",
        envVars: [],
      },
      {
        id: "paypal",
        name: "paypal",
        envVars: pluginEnvVars.paypal ?? [],
      },
      {
        id: "stripe",
        name: "stripe",
        envVars: pluginEnvVars.stripe ?? [],
      },
    ]);
    expect(payments).toHaveLength(4);

    expect(sortById(shipping)).toEqual([
      {
        id: "custom-plugin",
        name: "Custom Plugin",
        envVars: [],
      },
      {
        id: "dhl",
        name: "dhl",
        envVars: [],
      },
      {
        id: "premier-shipping",
        name: "premier-shipping",
        envVars: [],
      },
      {
        id: "ups",
        name: "ups",
        envVars: [],
      },
    ]);
    expect(shipping).toHaveLength(4);
  });
});
