/** @jest-environment node */
import { mkdir, writeFile, resetReverseLogisticsMocks } from "./reverseLogisticsTestHelpers";

describe("writeReverseLogisticsEvent (default data root)", () => {
  beforeEach(() => {
    jest.resetModules();
    resetReverseLogisticsMocks();
  });

  it("uses resolveDataRoot() when dataRoot arg is omitted", async () => {
    jest.doMock("@acme/platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/root",
    }));

    const mod = await import("../writeReverseLogisticsEvent");
    await mod.writeReverseLogisticsEvent("shop", "sess", "received");

    expect(mkdir).toHaveBeenCalledWith("/root/shop/reverse-logistics", {
      recursive: true,
    });
    expect(writeFile).toHaveBeenCalledWith(
      "/root/shop/reverse-logistics/uuid.json",
      JSON.stringify({ sessionId: "sess", status: "received" })
    );
  });
});

