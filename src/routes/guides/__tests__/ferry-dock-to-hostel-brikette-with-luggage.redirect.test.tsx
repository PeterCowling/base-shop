import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/renderers";

import type { LoaderFunctionArgs } from "react-router";

import FerryDockToBriketteGuideRedirect, {
  GUIDE_KEY,
  clientLoader,
  resolveTarget,
} from "@/routes/guides/ferry-dock-to-hostel-brikette-with-luggage";

const {
  breadcrumbState,
  redirectMock,
  navigateMock,
  useCurrentLanguageMock,
  langFromRequestMock,
  getSlugMock,
  guideSlugMock,
  breadcrumbMock,
  buildBreadcrumbMock,
} = vi.hoisted(() => {
  const state = { value: undefined as any };
  return {
    breadcrumbState: state,
    redirectMock: vi.fn((url: string) => ({ redirected: url })),
    navigateMock: vi.fn(),
    useCurrentLanguageMock: vi.fn<() => string | undefined>(() => "it"),
    langFromRequestMock: vi.fn(),
    getSlugMock: vi.fn((key: string, lang: string) => `${key}-${lang}`),
    guideSlugMock: vi.fn((lang: string, guideKey: string) => `${guideKey}-${lang}`),
    breadcrumbMock: vi.fn((props: any) => {
      state.value = props;
      return <div data-testid="breadcrumb" />;
    }),
    buildBreadcrumbMock: vi.fn(() => ({ trail: ["legacy", "target"] })),
  };
});

vi.mock("react-router", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("react-router");
  return {
    __esModule: true,
    ...actual,
    redirect: redirectMock,
  };
});

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("react-router-dom");
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: useCurrentLanguageMock,
}));

vi.mock("@/utils/lang", () => ({
  langFromRequest: langFromRequestMock,
}));

vi.mock("@/utils/slug", () => ({
  getSlug: getSlugMock,
}));

vi.mock("@/routes.guides-helpers", () => ({
  guideSlug: guideSlugMock,
}));

vi.mock("@/components/seo/BreadcrumbStructuredData", () => ({
  __esModule: true,
  default: breadcrumbMock,
}));

vi.mock("@/routes/guides/legacyRedirectBreadcrumb", () => ({
  buildLegacyGuideRedirectBreadcrumb: buildBreadcrumbMock,
}));

describe("ferry-dock-to-hostel-brikette-with-luggage redirect", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    navigateMock.mockClear();
    useCurrentLanguageMock.mockReset();
    useCurrentLanguageMock.mockReturnValue("it");
    langFromRequestMock.mockReset();
    getSlugMock.mockClear();
    guideSlugMock.mockClear();
    breadcrumbMock.mockClear();
    buildBreadcrumbMock.mockClear();
    breadcrumbState.value = undefined;
  });

  it("builds a slugged path for the provided language", () => {
    const result = resolveTarget("de" as any);

    expect(getSlugMock).toHaveBeenCalledWith("howToGetHere", "de");
    expect(guideSlugMock).toHaveBeenCalledWith("de", GUIDE_KEY);
    expect(result).toBe(`/de/howToGetHere-de/${GUIDE_KEY}-de`);
  });

  it("falls back to English when resolveTarget receives undefined", () => {
    const result = resolveTarget(undefined);
    expect(result).toBe(`/en/howToGetHere-en/${GUIDE_KEY}-en`);
  });

  it("clientLoader redirects callers to the resolved target", async () => {
    langFromRequestMock.mockReturnValueOnce("fr");
    const request = new Request("https://example.test/fr/guide");

    await expect(clientLoader({ request } as LoaderFunctionArgs)).rejects.toEqual({
      redirected: `/fr/howToGetHere-fr/${GUIDE_KEY}-fr`,
    });
    expect(langFromRequestMock).toHaveBeenCalledWith(request);
  });

  it("clientLoader defaults to English when no language is detected", async () => {
    langFromRequestMock.mockReturnValueOnce(undefined);
    const request = new Request("https://example.test/unknown");

    await expect(clientLoader({ request } as LoaderFunctionArgs)).rejects.toEqual({
      redirected: `/en/howToGetHere-en/${GUIDE_KEY}-en`,
    });
  });

  it("navigates to the computed target on mount and emits breadcrumb structured data", () => {
    useCurrentLanguageMock.mockReturnValueOnce("es");
    renderWithProviders(<FerryDockToBriketteGuideRedirect />, {
      route: "/es/guides/ferry-dock-to-hostel-brikette-with-luggage",
    });

    expect(navigateMock).toHaveBeenCalledWith(`/es/howToGetHere-es/${GUIDE_KEY}-es`, { replace: true });
    expect(buildBreadcrumbMock).toHaveBeenCalledWith({
      lang: "es",
      guideKey: GUIDE_KEY,
      targetPath: `/es/howToGetHere-es/${GUIDE_KEY}-es`,
    });
    expect((breadcrumbState.value as { breadcrumb: unknown }).breadcrumb).toEqual({
      trail: ["legacy", "target"],
    });
  });

  it("uses English as a safe fallback when the current language hook is undefined", () => {
    useCurrentLanguageMock.mockReturnValueOnce(undefined);
    renderWithProviders(<FerryDockToBriketteGuideRedirect />);

    expect(navigateMock).toHaveBeenCalledWith(`/en/howToGetHere-en/${GUIDE_KEY}-en`, { replace: true });
  });
});