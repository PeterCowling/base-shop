/** @jest-environment node */
import { writeReverseLogisticsEvent } from "../writeReverseLogisticsEvent";

import {
  mkdir,
  resetReverseLogisticsMocks,
  writeFile,
} from "./reverseLogisticsTestHelpers";

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
  jest.unmock("@acme/platform-core/repositories/rentalOrders.server");
  jest.unmock("@acme/platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@acme/platform-core/utils");
  jest.unmock("crypto");
});

