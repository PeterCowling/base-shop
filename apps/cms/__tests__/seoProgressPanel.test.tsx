// apps/cms/__tests__/seoProgressPanel.test.tsx
/* eslint-env jest */

const readSeoAuditsMock = jest.fn();
const listEventsMock = jest.fn();

jest.mock("@platform-core/repositories/seoAudit.server", () => ({
  readSeoAudits: (...a: unknown[]) => readSeoAuditsMock(...a),
}));

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: (...a: unknown[]) => listEventsMock(...a),
}));

import { render, screen, within } from "@testing-library/react";
import SeoProgressPanel from "../src/app/cms/shop/[shop]/settings/seo/SeoProgressPanel";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SeoProgressPanel", () => {
  it("shows audit scores and recommendations", async () => {
    readSeoAuditsMock.mockResolvedValueOnce([
      {
        timestamp: "2024-01-01T00:00:00Z",
        score: 92,
        recommendations: ["Add meta tags"],
      },
    ]);
    listEventsMock.mockResolvedValueOnce([
      {
        type: "page_view",
        timestamp: "2024-01-01T01:00:00Z",
        source: "organic",
      },
      {
        type: "page_view",
        timestamp: "2024-01-01T02:00:00Z",
        source: "organic",
      },
      {
        type: "audit_complete",
        timestamp: "2024-01-01T03:00:00Z",
        score: 0.92,
        issues: 3,
      },
    ]);

    const ui = await SeoProgressPanel({ shop: "s1" });
    render(ui);
    const table = screen.getByRole("table");
    expect(within(table).getByText("92")).toBeInTheDocument();
    expect(within(table).getByText("2")).toBeInTheDocument();
    expect(readSeoAuditsMock).toHaveBeenCalled();
    expect(screen.getByText("Add meta tags")).toBeInTheDocument();
    expect(screen.getByText(/score 92/)).toBeInTheDocument();
  });
});
