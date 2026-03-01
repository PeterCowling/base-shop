import { describe, expect, it, jest } from "@jest/globals";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: unknown }) => (
    <a href={href}>{children}</a>
  ),
}));

function mockHomeData(options: {
  isStale: boolean;
  syncedAt?: string;
  source?: string;
  readUrl?: string;
}) {
  jest.doMock("../../lib/demoData", () => ({
    XA_PRODUCTS: [
      {
        id: "1",
        slug: "studio-jacket",
        title: "Studio Jacket",
        createdAt: "2026-02-20T10:00:00.000Z",
        media: [{ type: "image", url: "/image.jpg", altText: "Studio jacket" }],
      },
    ],
    XA_CATALOG_RUNTIME_FRESHNESS: {
      isStale: options.isStale,
      syncedAt: options.syncedAt ?? null,
      ageMs: null,
    },
    XA_CATALOG_RUNTIME_META: {
      syncedAt: options.syncedAt ?? null,
      source: options.source ?? "contract",
      readUrl: options.readUrl,
    },
  }));
}

describe("xa-b home page freshness banner", () => {
  it("renders stale banner when runtime catalog is stale", async () => {
    jest.resetModules();
    mockHomeData({
      isStale: true,
      syncedAt: "2026-03-01T10:00:00.000Z",
      readUrl: "https://internal.example/catalog/xa-b",
    });
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: HomePage } = await import("../page");
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("Catalog data may be stale. Last sync:");
    expect(html).toContain("2026-03-01T10:00:00.000Z");
    expect(html).not.toContain("internal.example");
  });

  it("does not render stale banner when runtime catalog is fresh", async () => {
    jest.resetModules();
    mockHomeData({
      isStale: false,
      syncedAt: "2026-03-01T10:00:00.000Z",
    });
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: HomePage } = await import("../page");
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).not.toContain("Catalog data may be stale. Last sync:");
  });
});
