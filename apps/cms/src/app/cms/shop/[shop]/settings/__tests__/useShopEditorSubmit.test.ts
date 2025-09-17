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

  it("blocks submission when local validation fails", async () => {
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
    expect(result.current.saving).toBe(false);
    expect(updateShopMock).not.toHaveBeenCalled();

    act(() => {
      result.current.closeToast();
    });
    expect(result.current.toast.open).toBe(false);
  });

  it("handles server validation responses, success, and unexpected failures after passing client validation", async () => {
    const sections = createSections();
    const responseShop = {
      id: "s1",
      name: "Updated Shop",
      themeId: "theme",
      filterMappings: { size: "dimensions.size" },
      priceOverrides: { en: 42 },
      localeOverrides: { banner: "it" },
      luxuryFeatures: sections.identity.info.luxuryFeatures,
    };

    updateShopMock
      .mockResolvedValueOnce({ errors: { name: ["Required"] } })
      .mockResolvedValueOnce({ shop: responseShop })
      .mockRejectedValueOnce(new Error("Network error"));

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

    sections.overrides.filterMappings.rows = [
      { key: "", value: "" } as MappingRow,
    ];
    sections.localization.priceOverrides.rows = [
      { key: "en", value: "bad" } as MappingRow,
    ];
    sections.localization.localeOverrides.rows = [
      { key: "banner", value: "xx" } as MappingRow,
    ];

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(updateShopMock).not.toHaveBeenCalled();
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
    expect(result.current.saving).toBe(false);

    sections.overrides.filterMappings.rows = [
      { key: "size", value: "large" } as MappingRow,
    ];
    sections.localization.priceOverrides.rows = [
      { key: "en", value: "20" } as MappingRow,
    ];
    sections.localization.localeOverrides.rows = [
      { key: "banner", value: "en" } as MappingRow,
    ];

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(updateShopMock).toHaveBeenCalledTimes(1);
    expect(updateShopMock).toHaveBeenLastCalledWith(
      "s1",
      expect.any(FormData),
    );
    expect(result.current.errors).toEqual({ name: ["Required"] });
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message:
        "We couldn't save your changes. Please review the errors and try again.",
    });
    expect(result.current.saving).toBe(false);

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    expect(updateShopMock).toHaveBeenCalledTimes(2);
    expect(updateShopMock).toHaveBeenLastCalledWith(
      "s1",
      expect.any(FormData),
    );
    expect(sections.identity.setInfo).toHaveBeenCalledWith(responseShop);
    expect(sections.providers.setTrackingProviders).toHaveBeenCalledWith([
      "dhl",
      "ups",
    ]);
    expect(
      sections.overrides.filterMappings.setRows,
    ).toHaveBeenCalledWith([{ key: "size", value: "dimensions.size" }]);
    expect(
      sections.localization.priceOverrides.setRows,
    ).toHaveBeenCalledWith([{ key: "en", value: "42" }]);
    expect(
      sections.localization.localeOverrides.setRows,
    ).toHaveBeenCalledWith([{ key: "banner", value: "it" }]);
    expect(result.current.errors).toEqual({});
    expect(result.current.toast).toEqual({
      open: true,
      status: "success",
      message: "Shop settings saved successfully.",
    });
    expect(result.current.saving).toBe(false);

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await act(async () => {
      await result.current.onSubmit(submitEvent(form) as any);
    });

    consoleError.mockRestore();

    expect(updateShopMock).toHaveBeenCalledTimes(3);
    expect(updateShopMock).toHaveBeenLastCalledWith(
      "s1",
      expect.any(FormData),
    );
    expect(result.current.toast).toEqual({
      open: true,
      status: "error",
      message:
        "Something went wrong while saving your changes. Please try again.",
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.saving).toBe(false);
  });
});
