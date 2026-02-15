// Disable MSW - this test mocks all dependencies with Jest
import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

process.env.DISABLE_MSW = "1";

jest.mock("@cms/actions/shops.server", () => ({
  getSettings: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/seoAudit.server", () => ({
  readSeoAudits: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/products.server", () => ({
  readRepo: jest.fn(),
}));

const { getSettings } = jest.requireMock("@cms/actions/shops.server") as {
  getSettings: jest.Mock;
};

const { listEvents } = jest.requireMock(
  "@acme/platform-core/repositories/analytics.server",
) as {
  listEvents: jest.Mock;
};

const { readSeoAudits } = jest.requireMock(
  "@acme/platform-core/repositories/seoAudit.server",
) as {
  readSeoAudits: jest.Mock;
};

const { readRepo } = jest.requireMock(
  "@acme/platform-core/repositories/products.server",
) as {
  readRepo: jest.Mock;
};

const seoEditorMock = jest.fn((_props: any) => <div data-cy="seo-editor" />);
const aiCatalogMock = jest.fn((_props: any) => <div data-cy="ai-catalog" />);
const aiFeedMock = jest.fn((_props: any) => <div data-cy="ai-feed" />);
const seoAuditMock = jest.fn((_props: any) => <div data-cy="seo-audit" />);
const seoProgressMock = jest.fn((_props?: any) => <div />);
const sitemapStatusMock = jest.fn(() => <div data-cy="sitemap-status" />);

jest.mock("../src/app/cms/shop/[shop]/settings/seo/AiCatalogSettings", () => ({
  __esModule: true,
  default: (props: any) => aiCatalogMock(props),
}));

jest.mock("../src/app/cms/shop/[shop]/settings/seo/AiFeedPanel", () => ({
  __esModule: true,
  default: (props: any) => aiFeedMock(props),
}));

jest.mock("../src/app/cms/shop/[shop]/settings/seo/SeoProgressPanel", () => ({
  __esModule: true,
  default: (props: any) => seoProgressMock(props),
}));

jest.mock("../src/app/cms/shop/[shop]/settings/seo/SitemapStatusPanel", () => ({
  __esModule: true,
  default: () => sitemapStatusMock(),
}));

jest.mock("next/dynamic", () => {
  return (importer: () => Promise<any>) => {
    const key = importer.toString();
    if (key.includes("SeoEditor")) {
      return (props: any) => seoEditorMock(props);
    }
    if (key.includes("SeoAuditPanel")) {
      return (props: any) => seoAuditMock(props);
    }
    return () => null;
  };
});

async function loadSeoSettingsPage() {
  const mod = await import("../src/app/cms/shop/[shop]/settings/seo/page");
  return mod.default;
}

describe("SeoSettingsPage", () => {
  it("renders panels with props", async () => {
    const nowIso = new Date().toISOString();

    getSettings.mockResolvedValue({
      languages: ["en", "de"],
      seo: {
        en: { title: "EN title", description: "EN description" },
        de: { title: "DE title", description: "DE description" },
        aiCatalog: {
          enabled: true,
          fields: ["id", "title", "description", "price", "media"],
          pageSize: 100,
        },
      },
      freezeTranslations: false,
    });

    listEvents.mockResolvedValue([
      { shop: "s1", type: "ai_crawl", timestamp: nowIso },
    ]);

    readSeoAudits.mockResolvedValue([{ timestamp: nowIso }]);

    readRepo.mockResolvedValue([
      {
        id: "p1",
        title: "Product",
        description: "Desc",
        price: 123,
        media: [],
      },
    ]);

    const SeoSettingsPage = await loadSeoSettingsPage();
    const Page = await SeoSettingsPage({
      params: Promise.resolve({ shop: "s1" }),
    });

    render(Page);
    expect(await screen.findByTestId("seo-editor")).toBeInTheDocument();
    expect(await screen.findByTestId("ai-catalog")).toBeInTheDocument();
    expect(await screen.findByTestId("ai-feed")).toBeInTheDocument();
    expect(await screen.findByTestId("seo-audit")).toBeInTheDocument();

    expect(seoEditorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "s1",
        languages: ["en", "de"],
        initialSeo: expect.objectContaining({
          en: { title: "EN title", description: "EN description" },
          de: { title: "DE title", description: "DE description" },
          aiCatalog: expect.objectContaining({
            enabled: true,
            fields: ["id", "title", "description", "price", "media"],
            pageSize: 100,
          }),
        }),
        initialFreeze: false,
      }),
    );

    expect(aiCatalogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "s1",
        initial: {
          enabled: true,
          fields: ["id", "title", "description", "price", "media"],
          pageSize: 100,
          lastCrawl: nowIso,
        },
      }),
    );

    expect(aiFeedMock).toHaveBeenCalledWith(expect.objectContaining({ shop: "s1" }));
    expect(seoAuditMock).toHaveBeenCalledWith(expect.objectContaining({ shop: "s1" }));

    expect(getSettings).toHaveBeenCalledWith("s1");
    expect(listEvents).toHaveBeenCalled();
    expect(readSeoAudits).toHaveBeenCalledWith("s1");
    expect(readRepo).toHaveBeenCalledWith("s1");
  });
});
