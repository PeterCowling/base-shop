/** @jest-environment node */
import {
  mkdir,
  writeFile,
  resetReverseLogisticsMocks,
} from "./reverseLogisticsTestHelpers";

import { writeReverseLogisticsEvent } from "../writeReverseLogisticsEvent";

describe("writeReverseLogisticsEvent", () => {
  beforeEach(() => {
    resetReverseLogisticsMocks();
  });

  it("creates directory and writes file", async () => {
    await writeReverseLogisticsEvent("shop", "sess", "received", "/root");
    expect(mkdir).toHaveBeenCalledWith("/root/shop/reverse-logistics", {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      "/root/shop/reverse-logistics/uuid.json",
      JSON.stringify({ sessionId: "sess", status: "received" })
    );
  });
});

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@platform-core/repositories/rentalOrders.server");
  jest.unmock("@platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@platform-core/utils");
  jest.unmock("crypto");
});

