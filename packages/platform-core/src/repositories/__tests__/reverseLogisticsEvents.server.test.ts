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
import * as reverseLogistics from "../reverseLogisticsEvents.server";

const { recordEvent, listEvents, reverseLogisticsEvents } = reverseLogistics;

describe("reverse logistics events repository", () => {
  const create = prisma.reverseLogisticsEvent.create as jest.Mock;
  const findMany = prisma.reverseLogisticsEvent.findMany as jest.Mock;
  const nowIsoMock = nowIso as jest.Mock;

  beforeEach(() => {
    create.mockReset();
    findMany.mockReset();
    nowIsoMock.mockClear();
  });

  it("records event with provided createdAt", async () => {
    await recordEvent("shop1", "session1", "received", "time");
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
    await recordEvent("shop1", "session1", "qa");
    expect(nowIsoMock).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      data: {
        shop: "shop1",
        sessionId: "session1",
        event: "qa",
        createdAt: "mocked",
      },
    });
  });

  it("returns events ordered by createdAt", async () => {
    const events = [
      {
        id: "2",
        shop: "demo",
        sessionId: "b",
        event: "qa",
        createdAt: "2023-01-02",
      },
      {
        id: "1",
        shop: "demo",
        sessionId: "a",
        event: "received",
        createdAt: "2023-01-01",
      },
    ];
    findMany.mockResolvedValue(
      [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
    const result = await listEvents("demo");
    expect(findMany).toHaveBeenCalledWith({
      where: { shop: "demo" },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toEqual([
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
    ]);
  });
});

describe("reverse logistics event helpers", () => {
  const create = prisma.reverseLogisticsEvent.create as jest.Mock;

  beforeEach(() => {
    create.mockClear();
  });

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
