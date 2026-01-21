import { jest } from "@jest/globals";

import * as service from "../../services/shops";
import * as actions from "../shops.server";

jest.mock("../../services/shops", () => ({
  updateShop: jest.fn(),
  getSettings: jest.fn(),
  updateSeo: jest.fn(),
  generateSeo: jest.fn(),
  revertSeo: jest.fn(),
  setFreezeTranslations: jest.fn(),
  updateCurrencyAndTax: jest.fn(),
  updateDeposit: jest.fn(),
  updateReverseLogistics: jest.fn(),
  updateUpsReturns: jest.fn(),
  updatePremierDelivery: jest.fn(),
  updateAiCatalog: jest.fn(),
  updateStockAlert: jest.fn(),
  resetThemeOverride: jest.fn(),
}));

describe("shops.server actions", () => {
  const fd = new FormData();
  const shop = { id: "s" };

  const cases: Array<{
    name: keyof typeof actions;
    action: (...args: any[]) => Promise<any>;
    serviceFn: jest.Mock;
    args: any[];
    result: any;
  }> = [
    {
      name: "updateShop",
      action: actions.updateShop,
      serviceFn: service.updateShop as jest.Mock,
      args: ["s", fd],
      result: { shop },
    },
    {
      name: "getSettings",
      action: actions.getSettings,
      serviceFn: service.getSettings as jest.Mock,
      args: ["s"],
      result: { ok: true },
    },
    {
      name: "updateSeo",
      action: actions.updateSeo,
      serviceFn: service.updateSeo as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "generateSeo",
      action: actions.generateSeo,
      serviceFn: service.generateSeo as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "revertSeo",
      action: actions.revertSeo,
      serviceFn: service.revertSeo as jest.Mock,
      args: ["s", "t"],
      result: { ok: true },
    },
    {
      name: "setFreezeTranslations",
      action: actions.setFreezeTranslations,
      serviceFn: service.setFreezeTranslations as jest.Mock,
      args: ["s", true],
      result: { ok: true },
    },
    {
      name: "updateCurrencyAndTax",
      action: actions.updateCurrencyAndTax,
      serviceFn: service.updateCurrencyAndTax as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateDeposit",
      action: actions.updateDeposit,
      serviceFn: service.updateDeposit as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateReverseLogistics",
      action: actions.updateReverseLogistics,
      serviceFn: service.updateReverseLogistics as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateUpsReturns",
      action: actions.updateUpsReturns,
      serviceFn: service.updateUpsReturns as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updatePremierDelivery",
      action: actions.updatePremierDelivery,
      serviceFn: service.updatePremierDelivery as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateAiCatalog",
      action: actions.updateAiCatalog,
      serviceFn: service.updateAiCatalog as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateStockAlert",
      action: actions.updateStockAlert,
      serviceFn: service.updateStockAlert as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "resetThemeOverride",
      action: actions.resetThemeOverride,
      serviceFn: service.resetThemeOverride as jest.Mock,
      args: ["s", "token"],
      result: { ok: true },
    },
  ];

  describe.each(cases)('%s', ({ name, action, serviceFn, args, result }) => {
    afterEach(() => jest.clearAllMocks());

    test("forwards to service", async () => {
      serviceFn.mockResolvedValue(result);
      const res = await action(...args);
      expect(serviceFn).toHaveBeenCalledWith(...args);
      expect(res).toBe(result);
    });

    test("propagates errors", async () => {
      serviceFn.mockRejectedValue(new Error("fail"));
      await expect(action(...args)).rejects.toThrow("fail");
    });
  });
});

