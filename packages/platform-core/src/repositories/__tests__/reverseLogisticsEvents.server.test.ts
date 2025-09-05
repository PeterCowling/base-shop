jest.mock("../../db", () => ({
  prisma: {
    reverseLogisticsEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));
jest.mock("@acme/date-utils", () => ({
  nowIso: jest.fn(() => "now"),
}));

import { prisma } from "../../db";
import { nowIso } from "@acme/date-utils";
import {
  recordEvent,
  listEvents,
  reverseLogisticsEvents,
} from "../reverseLogisticsEvents.server";

const create = prisma.reverseLogisticsEvent.create as jest.Mock;
const findMany = prisma.reverseLogisticsEvent.findMany as jest.Mock;
const nowIsoMock = nowIso as jest.Mock;

beforeEach(() => {
  create.mockReset();
  findMany.mockReset();
  nowIsoMock.mockReset();
});

describe("recordEvent", () => {
  it("records event with provided createdAt", async () => {
    create.mockResolvedValue({});
    await expect(
      recordEvent("shop1", "session1", "received", "time")
    ).resolves.toBeUndefined();
    expect(nowIsoMock).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: {
        shop: "shop1",
        sessionId: "session1",
        event: "received",
        createdAt: "time",
      },
    });
  });

  it("records event with default createdAt", async () => {
    nowIsoMock.mockReturnValue("mocked");
    create.mockResolvedValue({});
    await recordEvent("shop1", "session1", "qa");
    expect(nowIsoMock).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        shop: "shop1",
        sessionId: "session1",
        event: "qa",
        createdAt: "mocked",
      },
    });
  });

  it("throws when create fails", async () => {
    const error = new Error("boom");
    create.mockRejectedValue(error);
    await expect(
      recordEvent("shop1", "session1", "received", "time")
    ).rejects.toThrow(error);
  });
});

describe("listEvents", () => {
  it("returns events ordered by createdAt", async () => {
    const events = [
      {
        id: "1",
        shop: "demo",
        sessionId: "a",
        event: "received",
        createdAt: "2023-01-01",
      },
      {
        id: "2",
        shop: "demo",
        sessionId: "b",
        event: "qa",
        createdAt: "2023-01-02",
      },
    ];
    findMany.mockResolvedValue(events);

    await expect(listEvents("demo")).resolves.toEqual(events);
    expect(findMany).toHaveBeenCalledWith({
      where: { shop: "demo" },
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns empty array when no events exist", async () => {
    findMany.mockResolvedValue([]);
    await expect(listEvents("demo")).resolves.toEqual([]);
  });

  it("throws when findMany fails", async () => {
    const error = new Error("boom");
    findMany.mockRejectedValue(error);
    await expect(listEvents("demo")).rejects.toThrow(error);
  });
});

describe("reverse logistics event helpers", () => {

  it.each([
    ["received", reverseLogisticsEvents.received],
    ["cleaning", reverseLogisticsEvents.cleaning],
    ["repair", reverseLogisticsEvents.repair],
    ["qa", reverseLogisticsEvents.qa],
    ["available", reverseLogisticsEvents.available],
  ])("records %s events", async (name, fn) => {
    await fn("shop1", "session1", "time");
    expect(create).toHaveBeenCalledWith({
      data: {
        shop: "shop1",
        sessionId: "session1",
        event: name,
        createdAt: "time",
      },
    });
  });
});
