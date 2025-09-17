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

jest.mock("@/components/atoms/shadcn", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
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
        type: "audit_complete",
        timestamp: "2024-01-01T03:00:00Z",
        score: 92,
        success: true,
      },
    ]);

    const ui = await SeoProgressPanel({ shop: "s1" });
    render(ui);
    const table = screen.getByRole("table");
    expect(within(table).getByText("92")).toBeInTheDocument();
    expect(within(table).getByText("ok")).toBeInTheDocument();
    expect(readSeoAuditsMock).toHaveBeenCalled();
    expect(listEventsMock).toHaveBeenCalled();
    expect(screen.getByText("Add meta tags")).toBeInTheDocument();
  });
});
