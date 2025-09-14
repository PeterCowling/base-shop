/* eslint-env jest */

const listEventsMock = jest.fn();

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: (...args: unknown[]) => listEventsMock(...args),
}));

import { render, screen } from "@testing-library/react";
import AiFeedPanel from "../src/app/cms/shop/[shop]/settings/seo/AiFeedPanel";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AiFeedPanel", () => {
  it("shows recent ai_crawl events for the target shop", async () => {
    listEventsMock.mockResolvedValue([
      { shop: "s1", type: "ai_crawl", timestamp: "2024-06-01T00:00:00Z", status: "old1" },
      { shop: "s1", type: "ai_crawl", timestamp: "2024-06-02T00:00:00Z", status: "old2" },
      { shop: "s2", type: "ai_crawl", timestamp: "2024-06-03T00:00:00Z", status: "other shop" },
      { shop: "s1", type: "other", timestamp: "2024-06-04T00:00:00Z", status: "wrong type" },
      { shop: "s1", type: "ai_crawl", timestamp: "2024-06-05T00:00:00Z", status: "s3" },
      { shop: "s1", type: "ai_crawl", timestamp: "2024-06-06T00:00:00Z", status: "s4" },
      { shop: "s1", type: "ai_crawl", timestamp: "2024-06-07T00:00:00Z", status: "s5" },
      { shop: "s1", type: "ai_crawl", timestamp: "2024-06-08T00:00:00Z", status: "s6" },
      { shop: "s1", type: "ai_crawl", timestamp: "2024-06-09T00:00:00Z", status: "s7" },
    ]);

    const ui = await AiFeedPanel({ shop: "s1" });
    render(ui);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[0].textContent).toContain("s7");
    expect(items[4].textContent).toContain("s3");
    expect(screen.queryByText("old1")).not.toBeInTheDocument();
    expect(screen.queryByText("other shop")).not.toBeInTheDocument();
    expect(screen.queryByText("wrong type")).not.toBeInTheDocument();
  });

  it("shows empty state when no events exist", async () => {
    listEventsMock.mockResolvedValue([]);

    const ui = await AiFeedPanel({ shop: "s1" });
    render(ui);

    expect(
      screen.getByText("No AI feed activity yet.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

