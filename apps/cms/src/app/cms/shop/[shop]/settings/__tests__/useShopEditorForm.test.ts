import { renderHook, act } from "@testing-library/react";
import { providersByType } from "@acme/configurator/providers";
import { LOCALES } from "@acme/types";
import useMappingRows from "@/hooks/useMappingRows";
import useShopEditorForm from "../useShopEditorForm";

jest.mock("@acme/configurator/providers", () => ({
  providersByType: jest.fn(),
}));

jest.mock("@/hooks/useMappingRows", () => jest.fn((rows: any[]) => ({
  rows,
  add: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  setRows: jest.fn(),
}))); 

jest.mock("../useShopEditorSubmit", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    saving: false,
    errors: {},
    toast: { open: false, status: "success", message: "" },
    closeToast: jest.fn(),
    onSubmit: jest.fn(),
  })),
}));

describe("useShopEditorForm", () => {
  const initialShop: any = {
    id: "s1",
    name: "Shop",
    themeId: "theme",
    filterMappings: [],
    priceOverrides: [],
    localeOverrides: [],
  };
  const initialTracking = ["ups"];

  const providersByTypeMock = providersByType as jest.MockedFunction<
    typeof providersByType
  >;
  const useMappingRowsMock = useMappingRows as jest.MockedFunction<
    typeof useMappingRows
  >;

  beforeEach(() => {
    providersByTypeMock.mockReturnValue([
      { id: "ups", name: "UPS", type: "shipping" },
      { id: "dhl", name: "DHL", type: "shipping" },
    ] as any);

    useMappingRowsMock.mockImplementation((rows: any[]) => ({
      rows,
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      setRows: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initial form state matches defaults", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    expect(result.current.info).toEqual(initialShop);
    expect(result.current.trackingProviders).toEqual(initialTracking);
    expect(result.current.shippingProviderOptions).toEqual([
      { label: "UPS", value: "ups" },
      { label: "DHL", value: "dhl" },
    ]);
    expect(result.current.localeOptions).toEqual(
      LOCALES.map((locale) => ({ label: locale, value: locale })),
    );
    expect(result.current.supportedLocales).toEqual([...LOCALES]);
  });

  it("updateField modifies state", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    act(() => {
      result.current.handleTextChange("name", "New Shop");
    });

    expect(result.current.info.name).toBe("New Shop");
  });

  it("toggle handlers update luxury features", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    act(() => {
      result.current.handleCheckboxChange("blog", true);
      result.current.handleLuxuryFeatureChange("fraudReviewThreshold", 10);
    });

    expect(result.current.info.luxuryFeatures.blog).toBe(true);
    expect(result.current.info.luxuryFeatures.fraudReviewThreshold).toBe(10);
  });

  it("mapping change delegates to controllers", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    const [filterController] = useMappingRowsMock.mock.results.map(
      (entry) => entry.value,
    );

    act(() => {
      result.current.handleMappingChange("filterMappings", 0, "key", "color");
    });

    expect(filterController.update).toHaveBeenCalledWith(0, "key", "color");
  });

  it("resetForm restores defaults", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    act(() => {
      result.current.handleTextChange("name", "New Shop");
      result.current.setTrackingProviders(["dhl"]);
    });

    act(() => {
      result.current.setInfo(initialShop);
      result.current.setTrackingProviders(initialTracking);
    });

    expect(result.current.info).toEqual(initialShop);
    expect(result.current.trackingProviders).toEqual(initialTracking);
  });
});

