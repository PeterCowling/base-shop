jest.mock("../../db", () => ({
  prisma: {
    reverseLogisticsEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "../../db";
import {
  reverseLogisticsEvents,
  listEvents,
} from "../reverseLogisticsEvents.server";

describe("reverse logistics events repository", () => {
  const create = prisma.reverseLogisticsEvent.create as jest.Mock;
  const findMany = prisma.reverseLogisticsEvent.findMany as jest.Mock;

  beforeEach(() => {
    create.mockReset();
    findMany.mockReset();
  });

  it("emits typed events", async () => {
    await reverseLogisticsEvents.cleaning("shop1", "session1", "time");
    expect(create).toHaveBeenCalledWith({
      data: {
        shop: "shop1",
        sessionId: "session1",
        event: "cleaning",
        createdAt: "time",
      },
    });
  });

  it("lists events for a shop", async () => {
    findMany.mockResolvedValue([]);
    await listEvents("demo");
    expect(findMany).toHaveBeenCalledWith({
      where: { shop: "demo" },
      orderBy: { createdAt: "asc" },
    });
  });
});
