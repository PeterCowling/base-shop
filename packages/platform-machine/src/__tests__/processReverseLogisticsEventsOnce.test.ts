/** @jest-environment node */
import path from "node:path";
import {
  readdir,
  readFile,
  unlink,
  markAvailable,
  markCleaning,
  markQa,
  markReceived,
  markRepair,
  reverseLogisticsEvents,
  logger,
  resetReverseLogisticsMocks,
} from "./reverseLogisticsTestHelpers";

import { processReverseLogisticsEventsOnce } from "../processReverseLogisticsEventsOnce";

describe("processReverseLogisticsEventsOnce", () => {
  beforeEach(() => {
    resetReverseLogisticsMocks();
  });

  const cases: Array<[string, jest.Mock, jest.Mock]> = [
    [
      "received",
      markReceived as jest.Mock,
      reverseLogisticsEvents.received as jest.Mock,
    ],
    ["cleaning", markCleaning as jest.Mock, reverseLogisticsEvents.cleaning as jest.Mock],
    ["repair", markRepair as jest.Mock, reverseLogisticsEvents.repair as jest.Mock],
    ["qa", markQa as jest.Mock, reverseLogisticsEvents.qa as jest.Mock],
    [
      "available",
      markAvailable as jest.Mock,
      reverseLogisticsEvents.available as jest.Mock,
    ],
  ];

  it("processes events for all shops when shopId is omitted", async () => {
    readdir
      .mockResolvedValueOnce(["shop"]) // list shops
      .mockResolvedValueOnce(["e.json"]); // list events
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );

    await processReverseLogisticsEventsOnce(undefined, "/data");

    expect(markReceived).toHaveBeenCalledWith("shop", "abc");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "abc");
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("rejects when listing shops fails", async () => {
    const err = new Error("nope");
    readdir.mockRejectedValueOnce(err);

    await expect(
      processReverseLogisticsEventsOnce(undefined, "/data")
    ).rejects.toBe(err);
    expect(readFile).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it.each(cases)("handles %s events", async (status, mark, evt) => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status })
    );

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(mark).toHaveBeenCalledWith("shop", "abc");
    expect(evt).toHaveBeenCalledWith("shop", "abc");
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("skips unsupported statuses", async () => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "unknown" })
    );

    await processReverseLogisticsEventsOnce("shop", "/data");

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
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("logs and removes file on parse error", async () => {
    readdir.mockResolvedValueOnce(["bad.json"]);
    readFile.mockResolvedValueOnce("not json");

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "bad.json",
        err: expect.anything(),
      }
    );
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "bad.json")
    );
  });

  it("logs and removes file on read error", async () => {
    readdir.mockResolvedValueOnce(["bad.json"]);
    readFile.mockRejectedValueOnce(new Error("nope"));

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "bad.json",
        err: expect.anything(),
      }
    );
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "bad.json")
    );
  });

  it("logs and removes file on handler error", async () => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );
    (markReceived as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    await processReverseLogisticsEventsOnce("shop", "/data");

    expect(logger.error).toHaveBeenCalledWith(
      "reverse logistics event failed",
      {
        shopId: "shop",
        file: "e.json",
        err: expect.anything(),
      }
    );
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
  });

  it("skips processing when readdir fails", async () => {
    readdir.mockRejectedValueOnce(new Error("nope"));

    await expect(
      processReverseLogisticsEventsOnce("shop", "/data")
    ).resolves.toBeUndefined();

    expect(readFile).not.toHaveBeenCalled();
    expect(unlink).not.toHaveBeenCalled();
  });

  it("swallows unlink errors", async () => {
    readdir.mockResolvedValueOnce(["e.json"]);
    readFile.mockResolvedValueOnce(
      JSON.stringify({ sessionId: "abc", status: "received" })
    );
    unlink.mockRejectedValueOnce(new Error("fail"));

    await expect(
      processReverseLogisticsEventsOnce("shop", "/data")
    ).resolves.toBeUndefined();

    expect(markReceived).toHaveBeenCalledWith("shop", "abc");
    expect(reverseLogisticsEvents.received).toHaveBeenCalledWith("shop", "abc");
    expect(unlink).toHaveBeenCalledWith(
      path.join("/data", "shop", "reverse-logistics", "e.json")
    );
    expect(logger.error).not.toHaveBeenCalled();
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

