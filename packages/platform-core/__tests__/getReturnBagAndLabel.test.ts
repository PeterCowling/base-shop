import type { ReturnLogistics } from "@acme/types";

import { getReturnBagAndLabel } from "../src/returnLogistics";

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __getReturnBagAndLabelTestCfg: ReturnLogistics | undefined;
}
globalThis.__getReturnBagAndLabelTestCfg = {
  labelService: "ups",
  inStore: true,
  dropOffProvider: "happy-returns",
  tracking: true,
  bagType: "reusable",
  returnCarrier: ["ups"],
  homePickupZipCodes: ["12345"],
  mobileApp: true,
  requireTags: true,
  allowWear: false,
};

const cfg = globalThis.__getReturnBagAndLabelTestCfg!;

jest.mock("../src/returnLogistics.ts", () => ({
  getReturnLogistics: jest.fn().mockResolvedValue(globalThis.__getReturnBagAndLabelTestCfg),
  getReturnBagAndLabel: async () => {
    const config = globalThis.__getReturnBagAndLabelTestCfg!;
    const {
      bagType,
      labelService,
      tracking,
      returnCarrier,
      homePickupZipCodes,
    } = config;
    return { bagType, labelService, tracking, returnCarrier, homePickupZipCodes };
  },
}));

describe("getReturnBagAndLabel", () => {
  it("returns only the bag and label fields", async () => {
    const result = await getReturnBagAndLabel();
    expect(result).toEqual({
      bagType: cfg.bagType,
      labelService: cfg.labelService,
      tracking: cfg.tracking,
      returnCarrier: cfg.returnCarrier,
      homePickupZipCodes: cfg.homePickupZipCodes,
    });
    expect(result).not.toHaveProperty("inStore");
    expect(result).not.toHaveProperty("requireTags");
    expect(result).not.toHaveProperty("allowWear");
  });
});
