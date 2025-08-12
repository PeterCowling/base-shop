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

import { render, screen } from "@testing-library/react";
import SeoProgressPanel from "../src/app/cms/shop/[shop]/settings/seo/SeoProgressPanel";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SeoProgressPanel", () => {
  it("shows audit scores, events, and recommendations", async () => {
    readSeoAuditsMock.mockResolvedValueOnce([
      {
        timestamp: "2024-01-01T00:00:00Z",
        score: 92,
        recommendations: ["Add meta tags"],
      },
    ]);
    listEventsMock.mockResolvedValueOnce([
      {
        type: "audit_complete",
        timestamp: "2024-01-01T01:00:00Z",
        score: 92,
      },
    ]);

    const ui = await SeoProgressPanel({ shop: "s1" });
    render(ui);
    expect(readSeoAuditsMock).toHaveBeenCalled();
    expect(listEventsMock).toHaveBeenCalled();
    expect(screen.getByText("Add meta tags")).toBeInTheDocument();
    expect(screen.getByText(/Score 92/)).toBeInTheDocument();
  });
});
