import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { MappingRowsController } from "../useShopEditorSubmit";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Accordion: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AccordionContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AccordionItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AccordionTrigger: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Button: ({ children, ...props }: any) => (
      <button {...props}>
        {children}
      </button>
    ),
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
    ),
    Input: (props: any) => <input {...props} />,
    Select: ({ children }: any) => <div data-select>{children}</div>,
    SelectTrigger: ({ children, ...props }: any) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectItem: ({ children, value, ...props }: any) => (
      <div role="option" data-value={value} {...props}>
        {children}
      </div>
    ),
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  }),
  { virtual: true },
);

jest.mock(
  "@/components/atoms",
  () => ({
    __esModule: true,
    Toast: ({ message, open, ...props }: any) =>
      open ? (
        <div data-testid="toast" {...props}>
          {message}
        </div>
      ) : null,
  }),
  { virtual: true },
);

jest.mock("@ui/components/cms/DataTable", () => ({
  __esModule: true,
  default: ({ rows }: any) => (
    <div data-testid="data-table">{rows.length} rows</div>
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname ?? ""} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@cms/actions/shops.server", () => ({
  __esModule: true,
  resetThemeOverride: jest.fn(),
}));

jest.mock("../useShopEditorForm", () => ({
  useShopEditorForm: jest.fn(),
}));

import ShopEditor from "../ShopEditor";
import { useShopEditorForm } from "../useShopEditorForm";

type MappingRowLike = { key: string; value: string };

const mockUseShopEditorForm = jest.mocked(useShopEditorForm);

const createMappingController = (
  rows: MappingRowLike[],
): MappingRowsController =>
  ({
    rows: rows as any,
    setRows: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  }) as unknown as MappingRowsController;

describe("ShopEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders sections, toast, and section errors from the form state", () => {
    const filterMappings = createMappingController([
      { key: "color", value: "attributes.color" },
    ]);
    const priceOverrides = createMappingController([
      { key: "en-US", value: "1200" },
    ]);
    const localeOverrides = createMappingController([
      { key: "/collections/new", value: "fr-FR" },
    ]);

    const info = {
      id: "shop-123",
      name: "Test Shop",
      themeId: "classic",
      catalogFilters: ["color"],
      themeDefaults: { "color-primary": "#fff" },
      themeOverrides: { "color-primary": "#000" },
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
    } as any;

    const identity = {
      info,
      setInfo: jest.fn(),
      handleChange: jest.fn(),
      handleTextChange: jest.fn(),
      handleCheckboxChange: jest.fn(),
      handleLuxuryFeatureChange: jest.fn(),
    } as any;

    const providers = {
      trackingProviders: [],
      shippingProviders: [{ id: "dhl", name: "DHL" }],
      shippingProviderOptions: [],
      setTrackingProviders: jest.fn(),
    } as any;

    const localization = {
      priceOverrides,
      localeOverrides,
      localeOptions: [],
      supportedLocales: ["en-US", "fr-FR"],
    } as any;

    const overrides = {
      filterMappings,
      tokenRows: [
        {
          token: "color-primary",
          defaultValue: "#fff",
          overrideValue: "#000",
          hasOverride: true,
          changed: true,
        },
      ],
    } as any;

    mockUseShopEditorForm.mockReturnValue({
      info,
      setInfo: jest.fn(),
      errors: {
        name: ["Shop name is required"],
        trackingProviders: ["Select at least one tracking provider"],
        filterMappings: ["Filter mapping issue"],
        priceOverrides: ["Price override issue"],
        localeOverrides: ["Locale override issue"],
      },
      tokenRows: overrides.tokenRows,
      saving: false,
      identity,
      providers,
      overrides,
      localization,
      toast: {
        open: true,
        status: "error",
        message: "Validation issues",
      },
      closeToast: jest.fn(),
      onSubmit: jest.fn(),
    } as any);

    const { container } = render(
      <ShopEditor
        shop="shop-123"
        initial={info}
        initialTrackingProviders={[]}
      />,
    );

    const sectionKeys = [
      "identity",
      "seo",
      "providers",
      "theme",
      "overrides",
      "localization",
    ];
    const renderedSections = Array.from(
      container.querySelectorAll("[data-section]"),
    )
      .map((node) => node.getAttribute("data-section"))
      .filter((value): value is string => Boolean(value));
    sectionKeys.forEach((key) => {
      expect(renderedSections).toContain(key);
    });

    const toast = screen.getByText("Validation issues");
    expect(toast).toHaveClass("bg-destructive");

    expect(screen.getByText("Shop name is required")).toBeInTheDocument();
    expect(
      screen.getByText("Select at least one tracking provider"),
    ).toBeInTheDocument();
    expect(screen.getByText("Filter mapping issue")).toBeInTheDocument();
    expect(screen.getByText("Price override issue")).toBeInTheDocument();
    expect(screen.getByText("Locale override issue")).toBeInTheDocument();
  });
});
