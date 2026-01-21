import { act,renderHook } from "@testing-library/react";

import { providersByType } from "@acme/configurator/providers";
import { LOCALES } from "@acme/types";

import useMappingRows from "@/hooks/useMappingRows";

import useShopEditorForm from "../useShopEditorForm";
import useShopEditorSubmit from "../useShopEditorSubmit";

jest.mock("@acme/configurator/providers", () => ({
  providersByType: jest.fn(),
}));

jest.mock("@/hooks/useMappingRows", () => jest.fn());

jest.mock("../useShopEditorSubmit", () => ({
  __esModule: true,
  default: jest.fn(),
}));

type MockMappingController = {
  rows: Array<{ key: string; value: string }>;
  add: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  setRows: jest.Mock;
};

describe("useShopEditorForm", () => {
  const initialShop: any = {
    id: "s1",
    name: "Shop",
    themeId: "theme",
    catalogFilters: ["color", "material"],
    luxuryFeatures: {
      blog: false,
      contentMerchandising: false,
      raTicketing: false,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
      premierDelivery: false,
      fraudReviewThreshold: 0,
    },
    filterMappings: { color: "red" },
    priceOverrides: { en: 10 },
    localeOverrides: { homepage: "en" },
    themeDefaults: { background: "#fff" },
    themeOverrides: { accent: "#000" },
  };
  const initialTracking = ["ups"];

  const providersByTypeMock =
    providersByType as jest.MockedFunction<typeof providersByType>;
  const useMappingRowsMock =
    useMappingRows as jest.MockedFunction<typeof useMappingRows>;
  const useShopEditorSubmitMock =
    useShopEditorSubmit as jest.MockedFunction<typeof useShopEditorSubmit>;

  const shippingProviders = [
    { id: "ups", name: "UPS", type: "shipping" },
    { id: "dhl", name: "DHL", type: "shipping" },
  ];

  let submitState: ReturnType<typeof useShopEditorSubmit>;

  beforeEach(() => {
    providersByTypeMock.mockReturnValue(shippingProviders as any);

    useMappingRowsMock.mockImplementation((initial: any = {}) => {
      const entries = Array.isArray(initial)
        ? initial.map(({ key, value }: { key: string; value: string }) => [
            key,
            value,
          ])
        : Object.entries(initial ?? {});
      const controller: MockMappingController = {
        rows: entries.map(([key, value]) => ({
          key: String(key),
          value: String(value),
        })),
        add: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        setRows: jest.fn(),
      };
      return controller;
    });

    submitState = {
      saving: false,
      errors: {} as Record<string, string[]>,
      toast: { open: false, status: "success" as const, message: "" },
      closeToast: jest.fn(),
      onSubmit: jest.fn(),
    } as unknown as ReturnType<typeof useShopEditorSubmit>;

    useShopEditorSubmitMock.mockReturnValue(submitState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("exposes derived values and nested sections", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    expect(useMappingRowsMock).toHaveBeenCalledTimes(3);

    expect(result.current.shippingProviders).toBe(shippingProviders);
    expect(result.current.shippingProviderOptions).toEqual([
      { label: "UPS", value: "ups" },
      { label: "DHL", value: "dhl" },
    ]);
    expect(result.current.supportedLocales).toEqual([...LOCALES]);
    expect(result.current.localeOptions).toEqual(
      LOCALES.map((locale) => ({ label: locale, value: locale })),
    );
    expect(result.current.filterMappings).toEqual([
      { key: "color", value: "red" },
    ]);
    expect(result.current.priceOverrides).toEqual([
      { key: "en", value: "10" },
    ]);
    expect(result.current.localeOverrides).toEqual([
      { key: "homepage", value: "en" },
    ]);

    expect(result.current.identity.info).toEqual(result.current.info);
    expect(result.current.localization.priceOverrides.rows).toEqual(
      result.current.priceOverrides,
    );
    expect(result.current.localization.localeOverrides.rows).toEqual(
      result.current.localeOverrides,
    );
    expect(result.current.providers.shippingProviders).toBe(
      shippingProviders,
    );
    expect(result.current.overrides.filterMappings.rows).toEqual(
      result.current.filterMappings,
    );
    expect(result.current.seo.catalogFilters).toEqual([
      "color",
      "material",
    ]);
    expect(typeof result.current.seo.setCatalogFilters).toBe("function");
    expect(result.current.overrides.tokenRows).toBe(result.current.tokenRows);

    expect(result.current.toast).toBe(submitState.toast);
    expect(result.current.errors).toBe(submitState.errors);

    expect(useShopEditorSubmitMock).toHaveBeenCalledWith({
      shop: "s1",
      identity: result.current.identity,
      localization: result.current.localization,
      providers: result.current.providers,
      overrides: result.current.overrides,
    });
  });

  it("section handlers update state and controllers", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    expect(result.current.identity.handleTextChange).toBe(
      result.current.handleTextChange,
    );

    act(() => {
      result.current.handleChange({
        target: { name: "name", value: "Renamed Shop" },
      } as any);
    });
    expect(result.current.info.name).toBe("Renamed Shop");
    expect(result.current.identity.info.name).toBe("Renamed Shop");

    act(() => {
      result.current.identity.handleTextChange("name", "Updated Shop");
    });
    expect(result.current.info.name).toBe("Updated Shop");
    expect(result.current.identity.info.name).toBe("Updated Shop");

    act(() => {
      result.current.identity.handleLuxuryFeatureChange(
        "fraudReviewThreshold",
        15,
      );
    });
    expect(result.current.info.luxuryFeatures.fraudReviewThreshold).toBe(15);

    act(() => {
      result.current.identity.handleCheckboxChange("blog", true);
    });
    expect(result.current.info.luxuryFeatures.blog).toBe(true);

    act(() => {
      result.current.providers.setTrackingProviders(["dhl"]);
    });
    expect(result.current.trackingProviders).toEqual(["dhl"]);
    expect(result.current.providers.trackingProviders).toEqual(["dhl"]);

    act(() => {
      result.current.localization.priceOverrides.add();
    });
    expect(
      (
        result.current.localization.priceOverrides as unknown as MockMappingController
      ).add,
    ).toHaveBeenCalled();

    act(() => {
      result.current.localization.localeOverrides.update(0, "value", "de");
    });
    expect(
      (
        result.current.localization.localeOverrides as unknown as MockMappingController
      ).update,
    ).toHaveBeenCalledWith(0, "value", "de");

    act(() => {
      result.current.overrides.filterMappings.remove(0);
    });
    expect(
      (
        result.current.overrides.filterMappings as unknown as MockMappingController
      ).remove,
    ).toHaveBeenCalledWith(0);

    act(() => {
      result.current.handleMappingChange("filterMappings", 1, "key", "size");
    });
    expect(
      (
        result.current.overrides.filterMappings as unknown as MockMappingController
      ).update,
    ).toHaveBeenCalledWith(1, "key", "size");

    act(() => {
      result.current.seo.setCatalogFilters(["brand"]);
    });
    expect(result.current.info.catalogFilters).toEqual(["brand"]);
    expect(result.current.seo.catalogFilters).toEqual(["brand"]);
  });
});
