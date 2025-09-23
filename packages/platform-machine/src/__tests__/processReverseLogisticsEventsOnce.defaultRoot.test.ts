/** @jest-environment node */
import path from "node:path";
import { readdir, readFile, unlink, resetReverseLogisticsMocks } from "./reverseLogisticsTestHelpers";

describe("processReverseLogisticsEventsOnce (default data root)", () => {
  beforeEach(() => {
    jest.resetModules();
    resetReverseLogisticsMocks();
  });

  it("uses resolveDataRoot() when dataRoot arg is omitted", async () => {
    jest.doMock("@platform-core/dataRoot", () => ({
      __esModule: true,
      resolveDataRoot: () => "/data",
    }));

    const mod = await import("../processReverseLogisticsEventsOnce");

    readdir
      .mockResolvedValueOnce(["shop"]) // list shops using /data
      .mockResolvedValueOnce(["e.json"]); // list events in shop
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );

    await mod.processReverseLogisticsEventsOnce();

    // ensure it used the mocked data root
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });
});

