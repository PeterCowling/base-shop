import type { ReturnLogistics } from "@acme/types";

const cfg: ReturnLogistics = {
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

jest.mock("../src/returnLogistics.ts", () => ({
  getReturnLogistics: jest.fn().mockResolvedValue(cfg),
  getReturnBagAndLabel: async () => {
    const {
      bagType,
      labelService,
      tracking,
      returnCarrier,
      homePickupZipCodes,
    } = await cfg;
    return { bagType, labelService, tracking, returnCarrier, homePickupZipCodes };
  },
}));

import { getReturnBagAndLabel } from "../src/returnLogistics";

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
    expect(result).not.toHaveProperty("dropOffProvider");
    expect(result).not.toHaveProperty("mobileApp");
    expect(result).not.toHaveProperty("requireTags");
    expect(result).not.toHaveProperty("allowWear");
  });
});
