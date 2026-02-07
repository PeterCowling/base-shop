// apps/cms/__tests__/seoAuditPanel.test.tsx
/* eslint-env jest */

import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import SeoAuditPanel from "../src/app/cms/shop/[shop]/settings/seo/SeoAuditPanel";

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

jest.mock("@/components/atoms", () => ({
  Skeleton: (props: any) => <div {...props} />,
  Toast: () => null,
  Tooltip: ({ children }: any) => <>{children}</>,
}));

describe("SeoAuditPanel", () => {
  const shop = "s1";
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("loads history and runs audit", async () => {
    const history = [
      {
        timestamp: "2024-01-01T00:00:00Z",
        score: 0.5,
        issues: 3,
        recommendations: ["Improve structured data"],
      },
    ];
    const newRecord = { timestamp: "2024-01-02T00:00:00Z", score: 0.8, issues: 1 };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => history })
      .mockResolvedValueOnce({ json: async () => newRecord }) as any;

    render(<SeoAuditPanel shop={shop} />);

    await waitFor(() =>
      expect(screen.getByText(/last run/i)).toBeInTheDocument(),
    );
    expect(screen.getByText("Improve structured data")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("50")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(`/api/seo/audit/${shop}`);

    fireEvent.click(screen.getByRole("button", { name: /run audit/i }));
    expect(global.fetch).toHaveBeenLastCalledWith(`/api/seo/audit/${shop}`, {
      method: "POST",
    });
    expect(screen.getByText("Audit in progress…")).toBeInTheDocument();

    await waitFor(() =>
      expect(within(screen.getByRole("table")).getByText("80")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Audit in progress…")).not.toBeInTheDocument();
  });
});

