/* eslint-env jest */

const listEventsMock = jest.fn();

jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: (...args: unknown[]) => listEventsMock(...args),
}));

jest.mock("@/components/atoms/shadcn", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Table: ({ children, ...props }: any) => (
    <table {...props}>{children}</table>
  ),
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
}));

import { render, screen, within } from "@testing-library/react";
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

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1); // skip header
    expect(rows).toHaveLength(5);
    expect(rows[0].textContent).toContain("s7");
    expect(rows[4].textContent).toContain("s3");
    expect(screen.queryByText("old1")).not.toBeInTheDocument();
    expect(screen.queryByText("other shop")).not.toBeInTheDocument();
    expect(screen.queryByText("wrong type")).not.toBeInTheDocument();
    expect(screen.getByText(/queue status/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh feed/i })).toBeInTheDocument();
  });

  it("shows empty state when no events exist", async () => {
    listEventsMock.mockResolvedValue([]);

    const ui = await AiFeedPanel({ shop: "s1" });
    render(ui);

    expect(
      screen.getByText("No AI feed activity yet.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

