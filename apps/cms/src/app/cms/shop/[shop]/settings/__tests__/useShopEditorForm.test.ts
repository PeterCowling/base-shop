import { renderHook, act } from "@testing-library/react";
import { providersByType } from "@acme/configurator/providers";
import useMappingRows from "@/hooks/useMappingRows";
import useShopEditorForm from "../useShopEditorForm";

jest.mock("@acme/configurator/providers", () => ({
  __esModule: true,
  providersByType: jest.fn(),
}));

jest.mock("@/hooks/useMappingRows", () => ({
  __esModule: true,
  default: jest.fn((rows: any[]) => ({
    rows,
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock("../useShopEditorSubmit", () => ({
  __esModule: true,
  default: jest.fn(() => ({ saving: false, errors: {}, onSubmit: jest.fn() })),
}));

const providersByTypeMock = providersByType as jest.MockedFunction<
  typeof providersByType
>;
const useMappingRowsMock = useMappingRows as jest.MockedFunction<
  typeof useMappingRows
>;

describe("useShopEditorForm", () => {
  const initialShop: any = {
    id: "s1",
    name: "Shop",
    themeId: "theme",
    filterMappings: [],
    priceOverrides: [],
    localeOverrides: [],
    luxuryFeatures: {
      blog: false,
    },
  };
  const initialTracking = ["ups"];

  beforeEach(() => {
    providersByTypeMock.mockReturnValue([
      { id: "ups", name: "UPS", type: "shipping" },
      { id: "dhl", name: "DHL", type: "shipping" },
    ]);

    useMappingRowsMock.mockImplementation((rows: any[]) => ({
      rows,
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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
    expect(result.current.localeOptions).toEqual([
      { label: "EN", value: "en" },
      { label: "DE", value: "de" },
      { label: "IT", value: "it" },
    ]);
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

  it("handleCheckboxChange updates nested values", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    act(() => {
      result.current.handleCheckboxChange("luxuryFeatures.blog", true);
    });

    expect(result.current.info.luxuryFeatures.blog).toBe(true);
  });

  it("handleMappingChange proxies to controller", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    act(() => {
      result.current.handleMappingChange("filterMappings", 0, "key", "category");
    });

    expect(result.current.updateFilterMapping).toHaveBeenCalledWith(
      0,
      "key",
      "category",
    );
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

