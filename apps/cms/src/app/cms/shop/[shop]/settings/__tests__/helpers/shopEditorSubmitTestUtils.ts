import type { MappingRow } from "@/hooks/useMappingRows";
import type {
  MappingRowsController,
  ShopEditorIdentitySection,
  ShopEditorLocalizationSection,
  ShopEditorOverridesSection,
  ShopEditorProvidersSection,
} from "../../useShopEditorSubmit";

export type MockMappingController = MappingRowsController & {
  setRows: jest.Mock;
  add: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
};

export type MockIdentitySection = ShopEditorIdentitySection & {
  setInfo: jest.Mock;
};

export type MockProvidersSection = ShopEditorProvidersSection & {
  setTrackingProviders: jest.Mock;
};

export type MockLocalizationSection = ShopEditorLocalizationSection & {
  priceOverrides: MockMappingController;
  localeOverrides: MockMappingController;
};

export type MockOverridesSection = ShopEditorOverridesSection & {
  filterMappings: MockMappingController;
};

export const createMappingController = (
  rows: MappingRow[] = [],
): MockMappingController =>
  ({
    rows,
    setRows: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as MockMappingController);

export const createIdentitySection = (): MockIdentitySection =>
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

export const createProvidersSection = (
  trackingProviders: string[] = ["ups"],
): MockProvidersSection =>
  ({
    shippingProviders: [],
    shippingProviderOptions: [],
    trackingProviders,
    setTrackingProviders: jest.fn(),
  } as unknown as MockProvidersSection);

export const createLocalizationSection = (
  priceRows: MappingRow[] = [{ key: "en", value: "10" }],
  localeRows: MappingRow[] = [{ key: "homepage", value: "en" }],
): MockLocalizationSection =>
  ({
    priceOverrides: createMappingController(priceRows),
    localeOverrides: createMappingController(localeRows),
    localeOptions: [],
    supportedLocales: [],
  } as MockLocalizationSection);

export const createOverridesSection = (
  filterRows: MappingRow[] = [{ key: "color", value: "red" }],
): MockOverridesSection =>
  ({
    filterMappings: createMappingController(filterRows),
    tokenRows: [],
  } as MockOverridesSection);

export const createSections = (options?: {
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

export const createForm = (fields: Record<string, string | string[]>) => {
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

export const submitEvent = (form: HTMLFormElement) => ({
  preventDefault() {},
  currentTarget: form,
});

