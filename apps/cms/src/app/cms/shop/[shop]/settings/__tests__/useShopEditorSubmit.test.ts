import { renderHook, act } from "@testing-library/react";
import {
  useShopEditorSubmit,
  buildStringMapping,
  buildNumberMapping,
} from "../useShopEditorSubmit";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));

const createForm = () => {
  const form = document.createElement("form");
  const id = document.createElement("input");
  id.name = "id";
  id.value = "s1";
  form.appendChild(id);
  const name = document.createElement("input");
  name.name = "name";
  name.value = "Shop";
  form.appendChild(name);
  const theme = document.createElement("input");
  theme.name = "themeId";
  theme.value = "theme";
  form.appendChild(theme);
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

  it("validates mappings", async () => {
    const filter = {
      rows: [{ key: "", value: "" }],
      setRows: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
    const price = {
      rows: [{ key: "en", value: "bad" }],
      setRows: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
    const locale = {
      rows: [{ key: "k", value: "xx" }],
      setRows: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
    const identity = {
      info: { id: "s1", name: "Shop", themeId: "theme" } as any,
      setInfo: jest.fn(),
      handleChange: jest.fn(),
    };
    const providers = {
      shippingProviders: [],
      trackingProviders: [],
      setTrackingProviders: jest.fn(),
    };
    const { result } = renderHook(() =>
      useShopEditorSubmit({
        shop: "s1",
        identity,
        localization: { priceOverrides: price, localeOverrides: locale },
        providers,
        overrides: { filterMappings: filter, tokenRows: [] },
      }),
    );

    const form = createForm();
    await act(async () => {
      await result.current.onSubmit({
        preventDefault() {},
        currentTarget: form,
      } as any);
    });

    expect(result.current.errors).toHaveProperty("filterMappings");
    expect(result.current.errors).toHaveProperty("priceOverrides");
    expect(result.current.errors).toHaveProperty("localeOverrides");
    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.status).toBe("error");
    const { updateShop } = require("@cms/actions/shops.server");
    expect(updateShop).not.toHaveBeenCalled();
  });
});
