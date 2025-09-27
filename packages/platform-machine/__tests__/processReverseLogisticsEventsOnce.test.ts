export {};

import {
  readdir,
  readFile,
  unlink,
  markReceived,
  markCleaning,
  markRepair,
  markQa,
  markAvailable,
  reverseLogisticsEvents,
  logger,
  resetReverseLogisticsMocks,
} from "../src/__tests__/reverseLogisticsTestHelpers";

jest.mock("@platform-core/dataRoot", () => ({ resolveDataRoot: () => "/data" }));

let service: typeof import("@acme/platform-machine");

beforeEach(() => {
  resetReverseLogisticsMocks();
});

describe("processReverseLogisticsEventsOnce", () => {
  beforeEach(async () => {
    service = await import("@acme/platform-machine");
  });

  const map = [
    ["received", markReceived, reverseLogisticsEvents.received],
    ["cleaning", markCleaning, reverseLogisticsEvents.cleaning],
    ["repair", markRepair, reverseLogisticsEvents.repair],
    ["qa", markQa, reverseLogisticsEvents.qa],
    ["available", markAvailable, reverseLogisticsEvents.available],
  ] as const;

  for (const [status, mark, evt] of map) {
    it(`handles ${status} events`, async () => {
      readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["a.json"]);
      readFile.mockResolvedValueOnce(
        JSON.stringify({ sessionId: "s", status })
      );
      await service.processReverseLogisticsEventsOnce(undefined, "/data");
      expect(mark).toHaveBeenCalledWith("shop", "s");
      expect(evt).toHaveBeenCalledWith("shop", "s");
      expect(unlink).toHaveBeenCalledWith("/data/shop/reverse-logistics/a.json");
    });
  }

  it("ignores unlink errors", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["a.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "s", status: "received" })
    );
    unlink.mockRejectedValueOnce(new Error("unlink fail"));
    await expect(
      service.processReverseLogisticsEventsOnce(undefined, "/data")
    ).resolves.toBeUndefined();
    expect(markReceived).toHaveBeenCalledWith("shop", "s");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "s");
    expect(unlink).toHaveBeenCalledWith("/data/shop/reverse-logistics/a.json");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("skips unknown status events", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["a.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "s", status: "unhandled" })
    );
    await service.processReverseLogisticsEventsOnce(undefined, "/data");
    expect(markReceived).not.toHaveBeenCalled();
    expect(markCleaning).not.toHaveBeenCalled();
    expect(markRepair).not.toHaveBeenCalled();
    expect(markQa).not.toHaveBeenCalled();
    expect(markAvailable).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.received).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.cleaning).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.repair).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.qa).not.toHaveBeenCalled();
    expect(reverseLogisticsEvents.available).not.toHaveBeenCalled();
    expect(unlink).toHaveBeenCalledWith(
      "/data/shop/reverse-logistics/a.json"
    );
  });

  it("continues when events directory is missing", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockRejectedValueOnce(new Error("nope"));
    await service.processReverseLogisticsEventsOnce(undefined, "/data");
    expect(readFile).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it("logs and removes file on error", async () => {
    readdir.mockResolvedValueOnce(["shop"]).mockResolvedValueOnce(["bad.json"]);
    readFile.mockResolvedValueOnce("not json");
    await service.processReverseLogisticsEventsOnce(undefined, "/data");
    expect(logger.error).toHaveBeenCalled();
    expect(unlink).toHaveBeenCalledWith("/data/shop/reverse-logistics/bad.json");
  });
});

afterAll(() => {
  jest.resetModules();
  jest.unmock("fs/promises");
  jest.unmock("@platform-core/repositories/rentalOrders.server");
  jest.unmock("@platform-core/repositories/reverseLogisticsEvents.server");
  jest.unmock("@platform-core/utils");
  jest.unmock("crypto");
  jest.unmock("@platform-core/dataRoot");
});

