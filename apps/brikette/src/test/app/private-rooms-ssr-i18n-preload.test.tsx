import type { ReactElement } from "react";
import React from "react";

const getMultipleTranslationsMock = jest.fn<
  Promise<Record<string, unknown>>,
  [string, readonly string[]]
>(async () => ({
  apartmentPage: ((key: string) => key) as unknown,
  _tokens: ((key: string) => key) as unknown,
}));
const getNamespaceBundlesMock = jest.fn<
  Promise<Record<string, Record<string, unknown>>>,
  [string, readonly string[]]
>(async () => ({ apartmentPage: {}, _tokens: {} }));

jest.mock("@/app/_lib/i18n-server", () => ({
  toAppLanguage: (lang: string) => lang,
  getTranslations: jest.fn(),
  getMultipleTranslations: (...args: [string, readonly string[]]) => getMultipleTranslationsMock(...args),
  getNamespaceBundles: (...args: [string, readonly string[]]) => getNamespaceBundlesMock(...args),
}));

jest.mock("@/app/[lang]/private-rooms/ApartmentPageContent", () => ({
  __esModule: true,
  default: (props: unknown) => React.createElement("div", props as Record<string, unknown>),
}));

jest.mock("@/app/[lang]/private-rooms/street-level-arrival/StreetLevelArrivalContent", () => ({
  __esModule: true,
  default: (props: unknown) => React.createElement("div", props as Record<string, unknown>),
}));

jest.mock("@/app/[lang]/private-rooms/private-stay/PrivateStayContent", () => ({
  __esModule: true,
  default: (props: unknown) => React.createElement("div", props as Record<string, unknown>),
}));

type PreloadProps = {
  lang: string;
  preloadedNamespaceBundles?: Record<string, Record<string, unknown>>;
  privateBookingPath?: string;
};

describe("private-room SSR i18n preload contract", () => {
  beforeEach(() => {
    getNamespaceBundlesMock.mockClear();
    getMultipleTranslationsMock.mockClear();
    getNamespaceBundlesMock.mockResolvedValue({ apartmentPage: {}, _tokens: {} });
    getMultipleTranslationsMock.mockResolvedValue({
      apartmentPage: ((key: string) => key) as unknown,
      _tokens: ((key: string) => key) as unknown,
    });
  });

  it("loads apartment and token translations on the server for the sea-view apartment route", async () => {
    const { default: ApartmentPage } = await import("@/app/[lang]/private-rooms/apartment/page");
    const element = (await ApartmentPage({
      params: Promise.resolve({ lang: "de" }),
    })) as ReactElement<PreloadProps>;

    expect(getMultipleTranslationsMock).toHaveBeenCalledWith(
      "de",
      expect.arrayContaining(["apartmentPage", "_tokens"]),
    );
    expect(getNamespaceBundlesMock).not.toHaveBeenCalled();
    expect(element.props.lang).toBe("de");
    expect(element.props.privateBookingPath).toMatch(/^\/de\//);
  });

  it("preloads apartment namespace for private-stay route variants", async () => {
    const { default: PrivateStayPage } = await import("@/app/[lang]/private-rooms/private-stay/page");
    const element = (await PrivateStayPage({
      params: Promise.resolve({ lang: "fr" }),
    })) as ReactElement<PreloadProps>;

    expect(getNamespaceBundlesMock).toHaveBeenCalledWith("fr", ["apartmentPage"]);
    expect(element.props.lang).toBe("fr");
    expect(element.props.preloadedNamespaceBundles).toEqual({ apartmentPage: {}, _tokens: {} });
  });

  it("preloads apartment namespace for street-level-arrival route variants", async () => {
    const { default: StreetLevelArrivalPage } = await import(
      "@/app/[lang]/private-rooms/street-level-arrival/page"
    );
    const element = (await StreetLevelArrivalPage({
      params: Promise.resolve({ lang: "es" }),
    })) as ReactElement<PreloadProps>;

    expect(getNamespaceBundlesMock).toHaveBeenCalledWith("es", ["apartmentPage"]);
    expect(element.props.lang).toBe("es");
    expect(element.props.preloadedNamespaceBundles).toEqual({ apartmentPage: {}, _tokens: {} });
  });
});
