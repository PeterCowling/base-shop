import { nowIso } from "@acme/date-utils";

import { prisma } from "../src/db";
import * as repo from "../src/repositories/reverseLogisticsEvents.server";

jest.mock("../src/db", () => ({
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

const create = prisma.reverseLogisticsEvent.create as jest.Mock;
const findMany = prisma.reverseLogisticsEvent.findMany as jest.Mock;
const nowIsoMock = nowIso as jest.Mock;

beforeEach(() => {
  create.mockReset();
  findMany.mockReset();
  nowIsoMock.mockReset();
});

describe("recordEvent", () => {
  it("inserts provided createdAt", async () => {
    create.mockResolvedValue({});
    await expect(
      repo.recordEvent("shop1", "session1", "received", "time")
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

  it("defaults createdAt via nowIso", async () => {
    nowIsoMock.mockReturnValue("mocked");
    create.mockResolvedValue({});
    await repo.recordEvent("shop1", "session1", "qa");
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
});

describe("listEvents", () => {
  it("orders events chronologically", async () => {
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
    await expect(repo.listEvents("demo")).resolves.toEqual(events);
    expect(findMany).toHaveBeenCalledWith({
      where: { shop: "demo" },
      orderBy: { createdAt: "asc" },
    });
  });
});

describe("reverse logistics helpers", () => {
  it("delegate to recordEvent with expected event", async () => {
    const spy = jest
      .spyOn(repo, "recordEvent")
      .mockResolvedValue(undefined);
    for (const [name, fn] of Object.entries(repo.reverseLogisticsEvents)) {
      await fn("shop1", "session1", "time");
      expect(spy).toHaveBeenLastCalledWith(
        "shop1",
        "session1",
        name,
        "time"
      );
    }
  });

  it("defaults createdAt when omitted", async () => {
    const spy = jest
      .spyOn(repo, "recordEvent")
      .mockResolvedValue(undefined);
    nowIsoMock.mockReturnValue("ts");
    await repo.reverseLogisticsEvents.cleaning("shop1", "session1");
    expect(spy).toHaveBeenCalledWith("shop1", "session1", "cleaning", "ts");
  });
});
