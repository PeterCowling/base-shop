import { describe, expect, it, jest } from "@jest/globals";

describe("package root exports", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("re-exports helpers from their source modules", async () => {
    const validateModule = await import("../validateShopName");
    const generateModule = await import("../generateMeta");

    const zodExports = {
      applyFriendlyZodMessages: jest.fn(),
      friendlyErrorMap: jest.fn(),
    };

    jest.doMock(
      "@acme/zod-utils/zodErrorMap",
      () => zodExports,
      { virtual: true },
    );

    const pkg = await import("../index");

    expect(pkg.validateShopName).toBe(validateModule.validateShopName);
    expect(pkg.SHOP_NAME_RE).toBe(validateModule.SHOP_NAME_RE);
    expect(pkg.applyFriendlyZodMessages).toBe(zodExports.applyFriendlyZodMessages);
    expect(pkg.friendlyErrorMap).toBe(zodExports.friendlyErrorMap);
    expect(pkg.generateMeta).toBe(generateModule.generateMeta);
  });

  it("re-exports initZod helpers", async () => {
    const initZodMock = jest.fn();
    const zodExports = {
      applyFriendlyZodMessages: jest.fn(),
      friendlyErrorMap: jest.fn(),
    };

    jest.doMock(
      "@acme/zod-utils/initZod",
      () => ({ initZod: initZodMock }),
      { virtual: true },
    );

    jest.doMock(
      "@acme/zod-utils/zodErrorMap",
      () => zodExports,
      { virtual: true },
    );

    const mod = await import("../initZod");

    expect(mod.initZod).toBe(initZodMock);
    expect(mod.applyFriendlyZodMessages).toBe(zodExports.applyFriendlyZodMessages);
    expect(mod.friendlyErrorMap).toBe(zodExports.friendlyErrorMap);
  });
});

