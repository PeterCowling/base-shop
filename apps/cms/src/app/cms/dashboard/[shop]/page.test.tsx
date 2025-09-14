import { render, screen } from "@testing-library/react";
import React from "react";
import { listEvents, readAggregates } from "@platform-core/repositories/analytics.server";
import { readShop } from "@platform-core/repositories/shops.server";
import { buildMetrics } from "@cms/lib/analytics";

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn(),
  readAggregates: jest.fn(),
}));

jest.mock("@platform-core/repositories/shops.server", () => ({
  readShop: jest.fn(),
}));

jest.mock("@cms/lib/analytics", () => ({
  buildMetrics: jest.fn(),
}));

jest.mock("./components/CampaignFilter.client", () => ({
  __esModule: true,
  CampaignFilter: ({ campaigns }: any) => (
    <div data-cy="campaign-filter">{campaigns.join(",")}</div>
  ),
}));

jest.mock("./components/Charts.client", () => ({
  __esModule: true,
  Charts: () => <div data-cy="charts" />,
}));

jest.mock("@acme/ui", () => ({
  Progress: () => <div data-cy="progress" />,
}));

const mockListEvents = listEvents as jest.Mock;
const mockReadAggregates = readAggregates as jest.Mock;
const mockReadShop = readShop as jest.Mock;
const mockBuildMetrics = buildMetrics as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

it("renders campaign filter and charts", async () => {
  mockListEvents.mockResolvedValue([{ campaign: "A" }]);
  mockReadAggregates.mockResolvedValue({});
  mockReadShop.mockResolvedValue({ domain: { name: "example.com", status: "active" } });
  mockBuildMetrics.mockReturnValue({
    traffic: [],
    sales: [],
    conversion: [],
    emailOpens: [],
    emailClicks: [],
    campaignSales: [],
    discountRedemptions: [],
    discountRedemptionsByCode: [],
    aiCrawl: [],
    topDiscountCodes: [],
    totals: {
      emailOpens: 0,
      emailClicks: 0,
      campaignSales: 0,
      discountRedemptions: 0,
      aiCrawl: 0,
    },
    maxTotal: 1,
  });

  const { default: Page } = await import("./page");
  render(
    await Page({ params: { shop: "s1" }, searchParams: {} })
  );

  expect(screen.getByText("Dashboard: s1")).toBeInTheDocument();
  expect(screen.getByTestId("campaign-filter")).toHaveTextContent("A");
  expect(screen.getByTestId("charts")).toBeInTheDocument();
});

