import { renderHook, act } from "@testing-library/react";
import useShopEditorForm from "../useShopEditorForm";

jest.mock("@acme/configurator/providers", () => ({
  providersByType: jest.fn(() => []),
}));

jest.mock("@/hooks/useMappingRows", () => jest.fn((rows: any[]) => ({
  rows,
  add: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
})));

jest.mock("../useShopEditorSubmit", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    saving: false,
    errors: {},
    onSubmit: jest.fn(),
    toast: { open: false, status: "success", message: "" },
    toastClassName: "",
    closeToast: jest.fn(),
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
      result.current.handleChange({
        target: { name: "name", value: "New Shop" },
      } as any);
    });

    expect(result.current.info.name).toBe("New Shop");
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
      result.current.handleChange({
        target: { name: "name", value: "New Shop" },
      } as any);
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

