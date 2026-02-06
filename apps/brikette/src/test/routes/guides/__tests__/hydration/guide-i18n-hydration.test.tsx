import React from "react";
import { render } from "@testing-library/react";

import i18n from "@/i18n";

// Track addResourceBundle calls
const addResourceBundleSpy = jest.fn();
(i18n as unknown as Record<string, unknown>).addResourceBundle = addResourceBundleSpy;

// Mock react-i18next with a controllable translator
const translationStore: Record<string, Record<string, string>> = {};

jest.mock("react-i18next", () => ({
  useTranslation: (ns: string, opts?: { lng?: string }) => {
    const lang = opts?.lng ?? "en";
    const storeKey = `${lang}/${ns}`;
    return {
      t: (key: string) => translationStore[storeKey]?.[key] ?? key,
      i18n,
    };
  },
}));

// Mock dependencies that GuideContent imports
jest.mock("@/components/guides/GuideBoundary", () => ({
  GuideBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/guides/PlanChoiceAnalytics", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/routes/guides/_GuideSeoTemplate", () => ({
  __esModule: true,
  default: () => <div data-testid="guide-seo-template" />,
}));
jest.mock("@/utils/loadI18nNs", () => ({
  preloadNamespacesWithFallback: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/utils/translation-fallback", () => ({
  resolveLabel: (_t: unknown, _key: string, fallback: string) => fallback,
  useEnglishFallback: () => (key: string) => key,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock("@/routes.guides-helpers", () => ({
  guideNamespace: () => ({ baseKey: "experiences", baseSlug: "experiences" }),
}));

// Import after mocks
import GuideContentMemo from "@/app/[lang]/experiences/[slug]/GuideContent";

// Unwrap memo for testing
const GuideContent = (GuideContentMemo as unknown as { type: React.ComponentType }).type ?? GuideContentMemo;

beforeEach(() => {
  addResourceBundleSpy.mockClear();
  for (const key of Object.keys(translationStore)) delete translationStore[key];
});

describe("GuideContent i18n hydration", () => {
  it("seeds i18n store from serverGuides prop", () => {
    const serverGuides = {
      components: { planChoice: { title: "Choose your plan" } },
      content: { positanoMainBeach: { intro: ["Beach intro"] } },
    };

    render(
      <GuideContent
        lang="en"
        guideKey={"positanoMainBeach" as never}
        serverGuides={serverGuides}
      />,
    );

    expect(addResourceBundleSpy).toHaveBeenCalledWith(
      "en",
      "guides",
      serverGuides,
      true,
      true,
    );
  });

  it("seeds English fallback when serverGuidesEn is provided", () => {
    const serverGuides = {
      content: { positanoMainBeach: { intro: ["Intro de"] } },
    };
    const serverGuidesEn = {
      content: { positanoMainBeach: { intro: ["Beach intro"] } },
    };

    render(
      <GuideContent
        lang={"de" as never}
        guideKey={"positanoMainBeach" as never}
        serverGuides={serverGuides}
        serverGuidesEn={serverGuidesEn}
      />,
    );

    expect(addResourceBundleSpy).toHaveBeenCalledWith(
      "de",
      "guides",
      serverGuides,
      true,
      true,
    );
    expect(addResourceBundleSpy).toHaveBeenCalledWith(
      "en",
      "guides",
      serverGuidesEn,
      true,
      true,
    );
  });

  it("does not crash without serverGuides prop (backward compat)", () => {
    expect(() => {
      render(
        <GuideContent
          lang="en"
          guideKey={"positanoMainBeach" as never}
        />,
      );
    }).not.toThrow();

    expect(addResourceBundleSpy).not.toHaveBeenCalled();
  });

  it("does not re-seed i18n store on re-render (ref guard)", () => {
    const serverGuides = {
      content: { positanoMainBeach: { intro: ["Beach intro"] } },
    };

    const { rerender } = render(
      <GuideContent
        lang="en"
        guideKey={"positanoMainBeach" as never}
        serverGuides={serverGuides}
      />,
    );

    expect(addResourceBundleSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender(
      <GuideContent
        lang="en"
        guideKey={"positanoMainBeach" as never}
        serverGuides={serverGuides}
      />,
    );

    // Should still be 1 — ref guard prevents second call
    expect(addResourceBundleSpy).toHaveBeenCalledTimes(1);
  });
});
