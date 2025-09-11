import { jest } from "@jest/globals";

const listEvents = jest.fn();
const readAggregates = jest.fn();

jest.doMock("../src/repositories/analytics.json.server", () => ({
  jsonAnalyticsRepository: { listEvents, readAggregates },
}));

describe("prismaAnalyticsRepository", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("proxies listEvents to jsonAnalyticsRepository", async () => {
    const { prismaAnalyticsRepository } = await import(
      "../src/repositories/analytics.prisma.server"
    );
    await prismaAnalyticsRepository.listEvents("shop");
    expect(listEvents).toHaveBeenCalledWith("shop");
  });

  it("proxies readAggregates to jsonAnalyticsRepository", async () => {
    const { prismaAnalyticsRepository } = await import(
      "../src/repositories/analytics.prisma.server"
    );
    await prismaAnalyticsRepository.readAggregates("shop");
    expect(readAggregates).toHaveBeenCalledWith("shop");
  });
});
