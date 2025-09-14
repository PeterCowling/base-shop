import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

const getSettings = jest.fn();
const listEvents = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({ getSettings }));
jest.mock("@platform-core/repositories/analytics.server", () => ({ listEvents }));

const seoEditorMock = jest.fn((props: any) => <div data-cy="seo-editor" />);
const aiCatalogMock = jest.fn((props: any) => <div data-cy="ai-catalog" />);
jest.mock("../src/app/cms/shop/[shop]/settings/seo/AiCatalogSettings", () => ({
  __esModule: true,
  default: (props: any) => aiCatalogMock(props),
}));

const aiFeedMock = jest.fn((props: any) => <div data-cy="ai-feed" />);
jest.mock("../src/app/cms/shop/[shop]/settings/seo/AiFeedPanel", () => ({
  __esModule: true,
  default: (props: any) => aiFeedMock(props),
}));

const seoAuditMock = jest.fn((props: any) => <div data-cy="seo-audit" />);
const seoProgressMock = jest.fn(() => <div />);
jest.mock("../src/app/cms/shop/[shop]/settings/seo/SeoProgressPanel", () => ({
  __esModule: true,
  default: (props: any) => seoProgressMock(props),
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

import SeoSettingsPage from "../src/app/cms/shop/[shop]/settings/seo/page";

describe("SeoSettingsPage", () => {
  it("renders panels with props", async () => {
    getSettings.mockResolvedValue({
      languages: ["en", "de"],
      seo: {
        title: "T",
        aiCatalog: { enabled: true, fields: ["id"], pageSize: 100 },
      },
      freezeTranslations: false,
    });
    listEvents.mockResolvedValue([
      { shop: "s1", type: "ai_crawl", timestamp: "2024-01-01T00:00:00Z" },
    ]);

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
        initialSeo: {
          title: "T",
          aiCatalog: { enabled: true, fields: ["id"], pageSize: 100 },
        },
        initialFreeze: false,
      }),
    );
    expect(aiCatalogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "s1",
        initial: {
          enabled: true,
          fields: ["id"],
          pageSize: 100,
          lastCrawl: "2024-01-01T00:00:00Z",
        },
      }),
    );
    expect(aiFeedMock).toHaveBeenCalledWith(
      expect.objectContaining({ shop: "s1" }),
    );
    expect(seoAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ shop: "s1" }),
    );

    expect(getSettings).toHaveBeenCalledWith("s1");
    expect(listEvents).toHaveBeenCalled();
  });
});
