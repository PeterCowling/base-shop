import { jest } from "@jest/globals";

import * as service from "../../services/shops/themeService";
import * as actions from "../shops-theme.server";

jest.mock("../../services/shops/themeService", () => ({
  updateShop: jest.fn(),
  resetThemeOverride: jest.fn(),
}));

describe("shops-theme.server actions", () => {
  const fd = new FormData();

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
      result: { shop: { id: "s" } },
    },
    {
      name: "resetThemeOverride",
      action: actions.resetThemeOverride,
      serviceFn: service.resetThemeOverride as jest.Mock,
      args: ["s", "token"],
      result: { ok: true },
    },
  ];

  describe.each(cases)("%s", ({ action, serviceFn, args, result }) => {
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
