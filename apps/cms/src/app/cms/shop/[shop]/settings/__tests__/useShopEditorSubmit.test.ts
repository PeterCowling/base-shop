import { renderHook, act } from "@testing-library/react";
import type { MappingRow } from "@/hooks/useMappingRows";
import {
  useShopEditorSubmit,
  buildStringMapping,
  buildNumberMapping,
  type MappingRowsController,
  type ShopEditorIdentitySection,
  type ShopEditorLocalizationSection,
  type ShopEditorOverridesSection,
  type ShopEditorProvidersSection,
} from "../useShopEditorSubmit";
import { updateShop } from "@cms/actions/shops.server";

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
}));

type MockMappingController = MappingRowsController & {
  setRows: jest.Mock;
  add: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
};

type MockIdentitySection = ShopEditorIdentitySection & {
  setInfo: jest.Mock;
};

type MockProvidersSection = ShopEditorProvidersSection & {
  setTrackingProviders: jest.Mock;
};

type MockLocalizationSection = ShopEditorLocalizationSection & {
  priceOverrides: MockMappingController;
  localeOverrides: MockMappingController;
};

type MockOverridesSection = ShopEditorOverridesSection & {
  filterMappings: MockMappingController;
};

const updateShopMock = updateShop as jest.MockedFunction<typeof updateShop>;

const createMappingController = (
  rows: MappingRow[] = [],
): MockMappingController =>
  ({
    rows,
    setRows: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as MockMappingController);

const createIdentitySection = (): MockIdentitySection =>
  ({
    info: {
      id: "s1",
      name: "Shop",
      themeId: "theme",
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
    } as any,
    setInfo: jest.fn(),
    handleChange: jest.fn(),
    handleTextChange: jest.fn(),
    handleCheckboxChange: jest.fn(),
    handleLuxuryFeatureChange: jest.fn(),
  } as unknown as MockIdentitySection);

const createProvidersSection = (
  trackingProviders: string[] = ["ups"],
): MockProvidersSection =>
  ({
    shippingProviders: [],
    shippingProviderOptions: [],
    trackingProviders,
    setTrackingProviders: jest.fn(),
  } as unknown as MockProvidersSection);

const createLocalizationSection = (
  priceRows: MappingRow[] = [{ key: "en", value: "10" }],
  localeRows: MappingRow[] = [{ key: "homepage", value: "en" }],
): MockLocalizationSection =>
  ({
    priceOverrides: createMappingController(priceRows),
    localeOverrides: createMappingController(localeRows),
    localeOptions: [],
    supportedLocales: [],
  } as MockLocalizationSection);

const createOverridesSection = (
  filterRows: MappingRow[] = [{ key: "color", value: "red" }],
): MockOverridesSection =>
  ({
    filterMappings: createMappingController(filterRows),
    tokenRows: [],
  } as MockOverridesSection);

const createSections = (options?: {
  filterRows?: MappingRow[];
  priceRows?: MappingRow[];
  localeRows?: MappingRow[];
  trackingProviders?: string[];
}) => {
  const identity = createIdentitySection();
  const localization = createLocalizationSection(
    options?.priceRows,
    options?.localeRows,
  );
  const providers = createProvidersSection(options?.trackingProviders);
  const overrides = createOverridesSection(options?.filterRows);
  return { identity, localization, providers, overrides };
};

const createForm = (fields: Record<string, string | string[]>) => {
  const form = document.createElement("form");
  Object.entries(fields).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((val) => {
        const input = document.createElement("input");
        input.name = name;
        input.value = val;
        form.appendChild(input);
      });
    } else {
      const input = document.createElement("input");
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
  });
  return form;
};

const submitEvent = (form: HTMLFormElement) => ({
  preventDefault() {},
  currentTarget: form,
});

describe("useShopEditorSubmit", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("builds mapping objects", () => {
    expect(buildStringMapping([{ key: " a ", value: " b " }])).toEqual({
      a: "b",
    });
    expect(buildNumberMapping([{ key: "en", value: "10" }])).toEqual({
      en: 10,
    });
  });

  it("validates mappings and surfaces toast errors", async () => {
    const sections = createSections({
      filterRows: [{ key: "", value: "" }],
      priceRows: [{ key: "en", value: "bad" }],
      localeRows: [{ key: "banner", value: "xx" }],
    });

    const { result } = renderHook(() =>
      useShopEditorSubmit({
        shop: "s1",
        identity: sections.identity,
        localization: sections.localization,
        providers: sections.providers,
        overrides: sections.overrides,
      }),
    );

    const form = createForm({ id: "s1", name: "Shop", themeId: "theme" });

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(result.current.errors).toEqual({
      filterMappings: ["All filter mappings must have key and value"],
      priceOverrides: [
        "All price overrides require locale and numeric value",
      ],
      localeOverrides: [
        "All locale overrides require key and valid locale",
      ],
    });
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message: "Please resolve the highlighted validation issues.",
    });
    expect(updateShopMock).not.toHaveBeenCalled();

    act(() => {
      result.current.closeToast();
    });
    expect(result.current.toast.open).toBe(false);
  });

  it("submits successfully and updates sections", async () => {
    const sections = createSections();
    const responseShop = {
      id: "s1",
      name: "Updated Shop",
      themeId: "theme",
      filterMappings: { size: "large" },
      priceOverrides: { en: 20 },
      localeOverrides: { banner: "de" },
      luxuryFeatures: sections.identity.info.luxuryFeatures,
    };
    updateShopMock.mockResolvedValue({ shop: responseShop });

    const form = createForm({
      id: "s1",
      name: "Shop",
      themeId: "theme",
      trackingProviders: ["dhl", "ups"],
    });

    const { result } = renderHook(() =>
      useShopEditorSubmit({
        shop: "s1",
        identity: sections.identity,
        localization: sections.localization,
        providers: sections.providers,
        overrides: sections.overrides,
      }),
    );

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(updateShopMock).toHaveBeenCalledWith("s1", expect.any(FormData));
    expect(sections.identity.setInfo).toHaveBeenCalledWith(responseShop);
    expect(sections.providers.setTrackingProviders).toHaveBeenCalledWith([
      "dhl",
      "ups",
    ]);
    expect(sections.overrides.filterMappings.setRows).toHaveBeenCalledWith([
      { key: "size", value: "large" },
    ]);
    expect(sections.localization.priceOverrides.setRows).toHaveBeenCalledWith([
      { key: "en", value: "20" },
    ]);
    expect(sections.localization.localeOverrides.setRows).toHaveBeenCalledWith([
      { key: "banner", value: "de" },
    ]);
    expect(result.current.errors).toEqual({});
    expect(result.current.toast).toEqual({
      open: true,
      status: "success",
      message: "Shop settings saved successfully.",
    });
    expect(result.current.saving).toBe(false);
  });

  it("handles server validation errors", async () => {
    const sections = createSections();
    updateShopMock.mockResolvedValue({
      errors: { name: ["Required"] },
    });

    const form = createForm({ id: "s1", name: "Shop", themeId: "theme" });

    const { result } = renderHook(() =>
      useShopEditorSubmit({
        shop: "s1",
        identity: sections.identity,
        localization: sections.localization,
        providers: sections.providers,
        overrides: sections.overrides,
      }),
    );

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(result.current.errors).toEqual({ name: ["Required"] });
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message:
        "We couldn't save your changes. Please review the errors and try again.",
    });
    expect(sections.identity.setInfo).not.toHaveBeenCalled();
  });

  it("handles unexpected failures with an error toast", async () => {
    const sections = createSections();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    updateShopMock.mockRejectedValue(new Error("Network error"));

    const form = createForm({ id: "s1", name: "Shop", themeId: "theme" });

    const { result } = renderHook(() =>
      useShopEditorSubmit({
        shop: "s1",
        identity: sections.identity,
        localization: sections.localization,
        providers: sections.providers,
        overrides: sections.overrides,
      }),
    );

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message:
        "Something went wrong while saving your changes. Please try again.",
    });
    expect(result.current.errors).toEqual({});
    expect(sections.identity.setInfo).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
