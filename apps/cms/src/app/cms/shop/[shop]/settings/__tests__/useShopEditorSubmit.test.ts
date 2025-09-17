import { renderHook, act } from "@testing-library/react";
import type { MappingRow } from "@/hooks/useMappingRows";
import {
  useShopEditorSubmit,
  buildStringMapping,
  buildNumberMapping,
  type MappingRowsController,
} from "../useShopEditorSubmit";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));

const { updateShop } = require("@cms/actions/shops.server") as {
  updateShop: jest.MockedFunction<
    typeof import("@cms/actions/shops.server")["updateShop"]
  >;
};

type HookArgs = Parameters<typeof useShopEditorSubmit>[0];

const createMappingController = (
  rows: MappingRow[],
): MappingRowsController => ({
  rows,
  add: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  setRows: jest.fn(),
});

const createHookArgs = ({
  filterMappingsRows = [{ key: "color", value: "red" }],
  priceOverridesRows = [{ key: "en", value: "10" }],
  localeOverridesRows = [{ key: "global", value: "en" }],
}: {
  filterMappingsRows?: MappingRow[];
  priceOverridesRows?: MappingRow[];
  localeOverridesRows?: MappingRow[];
} = {}) => {
  const filterMappings = createMappingController(filterMappingsRows);
  const priceOverrides = createMappingController(priceOverridesRows);
  const localeOverrides = createMappingController(localeOverridesRows);

  const identity = {
    info: { id: "s1", name: "Shop", themeId: "theme" } as any,
    setInfo: jest.fn(),
    handleChange: jest.fn(),
    handleTextChange: jest.fn(),
    handleCheckboxChange: jest.fn(),
    handleLuxuryFeatureChange: jest.fn(),
  };

  const localization = {
    priceOverrides,
    localeOverrides,
    localeOptions: [],
    supportedLocales: [],
  };

  const providers = {
    shippingProviders: [],
    shippingProviderOptions: [],
    trackingProviders: [],
    setTrackingProviders: jest.fn(),
  };

  const overrides = {
    filterMappings,
    tokenRows: [],
  };

  const args: HookArgs = {
    shop: "s1",
    identity,
    localization,
    providers,
    overrides,
  };

  return {
    args,
    controllers: { filterMappings, priceOverrides, localeOverrides },
    identity,
    providers,
  };
};

const createForm = (
  fields: Record<string, string | string[]> = {},
): HTMLFormElement => {
  const form = document.createElement("form");
  const defaults: Record<string, string | string[]> = {
    id: "s1",
    name: "Shop",
    themeId: "theme",
  };

  const combined = { ...defaults, ...fields };

  Object.entries(combined).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        const input = document.createElement("input");
        input.name = name;
        input.value = entry;
        form.appendChild(input);
      });
      return;
    }

    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  return form;
};

describe("useShopEditorSubmit", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("builds mapping objects", () => {
    expect(buildStringMapping([{ key: " a ", value: " b " }])).toEqual({ a: "b" });
    expect(buildNumberMapping([{ key: "en", value: "10" }])).toEqual({ en: 10 });
  });

  it("blocks submission and shows validation toast when local input is invalid", async () => {
    const { args } = createHookArgs({
      filterMappingsRows: [{ key: "", value: "" }],
    });
    const form = createForm();
    const { result } = renderHook(() => useShopEditorSubmit(args));

    await act(async () => {
      await result.current.onSubmit({
        preventDefault() {},
        currentTarget: form,
      } as any);
    });

    expect(updateShop).not.toHaveBeenCalled();
    expect(result.current.errors.filterMappings).toEqual([
      "All filter mappings must have key and value",
    ]);
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message: "Please resolve the highlighted validation issues.",
    });
  });

  it("resets errors and opens success toast after saving", async () => {
    const setup = createHookArgs();
    const { args, controllers, identity, providers } = setup;
    const savedShop = {
      id: "s1",
      name: "Updated Shop",
      themeId: "theme",
      filterMappings: { color: "blue" },
      priceOverrides: { en: 15 },
      localeOverrides: { global: "de" },
    } as any;
    updateShop.mockResolvedValueOnce({ shop: savedShop });

    const form = createForm({ trackingProviders: ["ups", "dhl"] });
    const { result } = renderHook(() => useShopEditorSubmit(args));

    await act(async () => {
      await result.current.onSubmit({
        preventDefault() {},
        currentTarget: form,
      } as any);
    });

    expect(updateShop).toHaveBeenCalledWith("s1", expect.any(FormData));
    expect(identity.setInfo).toHaveBeenCalledWith(savedShop);
    expect(providers.setTrackingProviders).toHaveBeenCalledWith([
      "ups",
      "dhl",
    ]);
    expect(controllers.filterMappings.setRows).toHaveBeenCalledWith([
      { key: "color", value: "blue" },
    ]);
    expect(controllers.priceOverrides.setRows).toHaveBeenCalledWith([
      { key: "en", value: "15" },
    ]);
    expect(controllers.localeOverrides.setRows).toHaveBeenCalledWith([
      { key: "global", value: "de" },
    ]);
    expect(result.current.errors).toEqual({});
    expect(result.current.toast).toEqual({
      open: true,
      status: "success",
      message: "Shop settings saved successfully.",
    });
  });

  it("surfaces server validation errors without skipping client validation", async () => {
    const { args, identity } = createHookArgs();
    updateShop.mockResolvedValueOnce({
      errors: { name: ["Name already taken"] },
    });

    const form = createForm();
    const { result } = renderHook(() => useShopEditorSubmit(args));

    await act(async () => {
      await result.current.onSubmit({
        preventDefault() {},
        currentTarget: form,
      } as any);
    });

    expect(updateShop).toHaveBeenCalledTimes(1);
    expect(identity.setInfo).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({
      name: ["Name already taken"],
    });
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message:
        "We couldn't save your changes. Please review the errors and try again.",
    });
  });

  it("shows failure toast when updateShop throws", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { args, identity } = createHookArgs();
    updateShop.mockRejectedValueOnce(new Error("Network failure"));

    const form = createForm();
    const { result } = renderHook(() => useShopEditorSubmit(args));

    await act(async () => {
      await result.current.onSubmit({
        preventDefault() {},
        currentTarget: form,
      } as any);
    });

    expect(updateShop).toHaveBeenCalledTimes(1);
    expect(identity.setInfo).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({});
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message:
        "Something went wrong while saving your changes. Please try again.",
    });

    consoleErrorSpy.mockRestore();
  });
});
