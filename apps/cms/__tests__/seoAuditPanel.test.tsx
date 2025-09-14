// apps/cms/__tests__/seoAuditPanel.test.tsx
/* eslint-env jest */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import SeoAuditPanel from "../src/app/cms/shop/[shop]/settings/seo/SeoAuditPanel";

describe("SeoAuditPanel", () => {
  const shop = "s1";
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("loads history and runs audit", async () => {
    const history = [{ timestamp: "2024-01-01T00:00:00Z", score: 0.5, issues: 3 }];
    const newRecord = { timestamp: "2024-01-02T00:00:00Z", score: 0.8, issues: 1 };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => history })
      .mockResolvedValueOnce({ json: async () => newRecord }) as any;

    render(<SeoAuditPanel shop={shop} />);

    await screen.findByText("Score: 50");
    expect(screen.getByText("Issues found: 3")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(`/api/seo/audit/${shop}`);

    fireEvent.click(screen.getByRole("button", { name: /run audit/i }));
    expect(global.fetch).toHaveBeenLastCalledWith(`/api/seo/audit/${shop}`, { method: "POST" });
    expect(screen.getByText("Audit in progress…")).toBeInTheDocument();

    await screen.findByText("Score: 80");
    expect(screen.getByText("Issues found: 1")).toBeInTheDocument();
    expect(screen.queryByText("Audit in progress…")).not.toBeInTheDocument();
  });
});

