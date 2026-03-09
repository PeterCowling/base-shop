import { describe, expect, it, jest } from "@jest/globals";

describe("package root exports", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("re-exports helpers from their source modules", async () => {
    const validateModule = await import("../validateShopName.js");

    const zodExports = {
      applyFriendlyZodMessages: jest.fn(),
      friendlyErrorMap: jest.fn(),
    };

    jest.doMock(
      "@acme/zod-utils/zodErrorMap",
      () => zodExports,
      { virtual: true },
    );

    const pkg = await import("../index.js");

    expect(pkg.validateShopName).toBe(validateModule.validateShopName);
    expect(pkg.SHOP_NAME_RE).toBe(validateModule.SHOP_NAME_RE);
    expect(pkg.applyFriendlyZodMessages).toBe(zodExports.applyFriendlyZodMessages);
    expect(pkg.friendlyErrorMap).toBe(zodExports.friendlyErrorMap);
    // generateMeta is server-only (uses fs) and must NOT be in the barrel export
    expect(pkg).not.toHaveProperty("generateMeta");
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

    const mod = await import("../initZod.js");

    expect(mod.initZod).toBe(initZodMock);
    expect(mod.applyFriendlyZodMessages).toBe(zodExports.applyFriendlyZodMessages);
    expect(mod.friendlyErrorMap).toBe(zodExports.friendlyErrorMap);
  });

  it("exposes math helper subpaths", async () => {
    const graphModule = await import("../math/graph/index.js");
    const optimizationModule = await import("../math/optimization/index.js");
    const survivalModule = await import("../math/survival/index.js");

    expect(graphModule).toHaveProperty("analyzeDependencyGraph");
    expect(graphModule).toHaveProperty("DependencyGraphValidationError");
    expect(optimizationModule).toHaveProperty("solveBinaryPortfolio");
    expect(optimizationModule).toHaveProperty("PortfolioModelValidationError");
    expect(survivalModule).toHaveProperty("estimateKaplanMeierCurve");
    expect(survivalModule).toHaveProperty("SurvivalObservationValidationError");
  });
});
