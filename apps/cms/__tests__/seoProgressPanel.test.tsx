// apps/cms/__tests__/seoProgressPanel.test.tsx
/* eslint-env jest */

const readSeoAuditsMock = jest.fn();
const listEventsMock = jest.fn();
const useTranslations = jest.fn();

const translations: Record<string, string> = {
  "cms.seo.progress.title": "SEO progress",
  "cms.seo.progress.subtitle": "Track recent audit scores",
  "cms.seo.progress.latestScore": "Latest score",
  "cms.seo.progress.averageScore": "Average score",
  "cms.seo.progress.auditCount": "Audit count",
  "cms.seo.progress.noData": "No audit data yet",
  "cms.seo.progress.latestRecommendations": "Latest recommendations",
  "cms.seo.progress.recentAudits": "Recent audits",
  "cms.seo.progress.time": "Time",
  "cms.seo.progress.score": "Score",
  "cms.seo.progress.outcome": "Outcome",
  "cms.seo.progress.ok": "ok",
  "cms.seo.progress.failed": "failed",
};

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations,
}));

jest.mock("@acme/platform-core/repositories/seoAudit.server", () => ({
  readSeoAudits: (...a: unknown[]) => readSeoAuditsMock(...a),
}));

jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
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

  const translator = (key: string) =>
    translations[key as keyof typeof translations] ?? key;
  useTranslations.mockResolvedValue(translator);
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
