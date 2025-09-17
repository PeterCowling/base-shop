import { renderHook, act } from "@testing-library/react";
import useShopEditorForm from "../useShopEditorForm";

const mockSubmit = jest.fn(() => ({ saving: false, errors: {}, onSubmit: jest.fn() }));

jest.mock("@acme/configurator/providers", () => ({
  providersByType: jest.fn(() => [{ id: "ups", name: "UPS", type: "shipping" }]),
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
  SUPPORTED_LOCALES: ["en", "de"],
  default: (...args: any[]) => mockSubmit(...args),
}));

describe("useShopEditorForm", () => {
  const initialShop: any = {
    id: "s1",
    name: "Shop",
    themeId: "theme",
    catalogFilters: ["color"],
    filterMappings: [],
    priceOverrides: [],
    localeOverrides: [],
    luxuryFeatures: {
      blog: false,
      contentMerchandising: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
      premierDelivery: false,
    },
    themeDefaults: { color: "#fff" },
    themeOverrides: {},
  };
  const initialTracking = ["ups"];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns grouped section props", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    expect(result.current.identity.values.name).toBe("Shop");
    expect(result.current.localization.catalogFilters.value).toBe("color");
    expect(result.current.providers.selected).toEqual(initialTracking);
    expect(result.current.overrides.shop).toBe("s1");
    expect(result.current.form.id).toBe("s1");
  });

  it("updates identity values when handlers are invoked", () => {
    const { result } = renderHook(() =>
      useShopEditorForm({
        shop: "s1",
        initial: initialShop,
        initialTrackingProviders: initialTracking,
      }),
    );

    act(() => {
      result.current.identity.onNameChange("Updated");
    });

    expect(result.current.identity.values.name).toBe("Updated");

    act(() => {
      result.current.providers.onToggle("ups", false);
    });

    expect(result.current.providers.selected).toEqual([]);
  });
});

