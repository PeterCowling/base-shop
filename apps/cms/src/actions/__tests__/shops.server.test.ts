import { jest } from "@jest/globals";

import * as seoService from "../../services/shops/seoService";
import * as settingsService from "../../services/shops/settingsService";
import * as actions from "../shops.server";

jest.mock("../../services/shops/seoService", () => ({
  updateSeo: jest.fn(),
  generateSeo: jest.fn(),
  revertSeo: jest.fn(),
}));

jest.mock("../../services/shops/settingsService", () => ({
  getSettings: jest.fn(),
  setFreezeTranslations: jest.fn(),
  updateCurrencyAndTax: jest.fn(),
  updateDeposit: jest.fn(),
  updateLateFee: jest.fn(),
  updateReverseLogistics: jest.fn(),
  updateUpsReturns: jest.fn(),
  updatePremierDelivery: jest.fn(),
  updateAiCatalog: jest.fn(),
  updateStockAlert: jest.fn(),
}));

describe("shops.server actions", () => {
  const fd = new FormData();
  const settings = { id: "s" };

  const cases: Array<{
    name: keyof typeof actions;
    action: (...args: any[]) => Promise<any>;
    serviceFn: jest.Mock;
    args: any[];
    result: any;
  }> = [
    {
      name: "getSettings",
      action: actions.getSettings,
      serviceFn: settingsService.getSettings as jest.Mock,
      args: ["s"],
      result: settings,
    },
    {
      name: "updateSeo",
      action: actions.updateSeo,
      serviceFn: seoService.updateSeo as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "generateSeo",
      action: actions.generateSeo,
      serviceFn: seoService.generateSeo as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "revertSeo",
      action: actions.revertSeo,
      serviceFn: seoService.revertSeo as jest.Mock,
      args: ["s", "t"],
      result: { ok: true },
    },
    {
      name: "setFreezeTranslations",
      action: actions.setFreezeTranslations,
      serviceFn: settingsService.setFreezeTranslations as jest.Mock,
      args: ["s", true],
      result: { ok: true },
    },
    {
      name: "updateCurrencyAndTax",
      action: actions.updateCurrencyAndTax,
      serviceFn: settingsService.updateCurrencyAndTax as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateDeposit",
      action: actions.updateDeposit,
      serviceFn: settingsService.updateDeposit as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateLateFee",
      action: actions.updateLateFee,
      serviceFn: settingsService.updateLateFee as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateReverseLogistics",
      action: actions.updateReverseLogistics,
      serviceFn: settingsService.updateReverseLogistics as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateUpsReturns",
      action: actions.updateUpsReturns,
      serviceFn: settingsService.updateUpsReturns as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updatePremierDelivery",
      action: actions.updatePremierDelivery,
      serviceFn: settingsService.updatePremierDelivery as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateAiCatalog",
      action: actions.updateAiCatalog,
      serviceFn: settingsService.updateAiCatalog as jest.Mock,
      args: ["s", fd],
      result: { ok: true },
    },
    {
      name: "updateStockAlert",
      action: actions.updateStockAlert,
      serviceFn: settingsService.updateStockAlert as jest.Mock,
      args: ["s", fd],
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
