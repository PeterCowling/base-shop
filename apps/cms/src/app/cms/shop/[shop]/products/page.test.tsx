import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const createDraftMock = jest.fn();
const deleteProductMock = jest.fn();
const duplicateProductMock = jest.fn();

jest.mock("@cms/actions/products.server", () => ({
  createDraft: (...args: unknown[]) => createDraftMock(...args),
  deleteProduct: (...args: unknown[]) => deleteProductMock(...args),
  duplicateProduct: (...args: unknown[]) => duplicateProductMock(...args),
}));

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const checkShopExistsMock = jest.fn();
jest.mock("@acme/lib", () => ({
  checkShopExists: (...args: unknown[]) => checkShopExistsMock(...args),
}));

const readRepoMock = jest.fn();
jest.mock("@acme/platform-core/repositories/json.server", () => ({
  readRepo: (...args: unknown[]) => readRepoMock(...args),
}));

const productsTableRenderSpy = jest.fn();
jest.mock("@acme/ui/components/cms/ProductsTable.client", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => {
      productsTableRenderSpy(props);
      return React.createElement(
        "div",
        {
          "data-cy": "products-table",
          "data-is-admin": String(props.isAdmin),
        },
        null,
      );
    },
  };
});

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, asChild, ...props }: any) =>
      asChild && React.isValidElement(children)
        ? React.cloneElement(children, props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    CardContent: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
  };
});

jest.mock("@acme/ui/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Alert: ({ heading, children, ...props }: any) =>
      React.createElement("div", { role: "alert", ...props }, heading ?? children ?? null),
    Progress: ({ label }: any) =>
      React.createElement("div", { role: label ? "progressbar" : undefined }, label ?? null),
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
  };
});

jest.mock("@acme/ui/components/atoms/primitives", () => {
  const React = require("react");
  return {
    __esModule: true,
    Inline: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
  };
});

jest.mock("@acme/ui/components/cms", () => {
  const React = require("react");
  return {
    __esModule: true,
    CmsBuildHero: () => React.createElement("div", { "data-testid": "cms-build-hero" }),
    CmsMetricTiles: () => React.createElement("div", { "data-testid": "cms-metric-tiles" }),
    CmsLaunchChecklist: () => React.createElement("div", { "data-testid": "cms-launch-checklist" }),
  };
});

jest.mock("@acme/i18n/useTranslations.server", () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}));

jest.mock("@acme/telemetry", () => ({
  __esModule: true,
  track: jest.fn(),
}));

jest.mock("@acme/ui/utils/style", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ href, children, ...props }: any) =>
      React.createElement("a", { href, ...props }, children),
  };
});

import { __setMockSession } from "next-auth";

const notFoundMock = jest.fn();
jest.mock("next/navigation", () => ({
  notFound: (...args: unknown[]) => notFoundMock(...args),
}));

const sampleProducts = [
  {
    id: "p1",
    sku: "SKU1",
    title: { en: "Alpha" },
    description: { en: "" },
    price: 1000,
    currency: "USD",
    media: [],
    created_at: "",
    updated_at: "",
    shop: "acme",
    status: "active",
    row_version: 1,
  },
  {
    id: "p2",
    sku: "SKU2",
    title: { en: "Beta" },
    description: { en: "" },
    price: 2000,
    currency: "USD",
    media: [],
    created_at: "",
    updated_at: "",
    shop: "acme",
    status: "draft",
    row_version: 1,
  },
];

describe("ProductsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkShopExistsMock.mockResolvedValue(true);
    readRepoMock.mockResolvedValue(sampleProducts);
    __setMockSession({ user: { role: "viewer" } } as any);
  });

  it("shows viewer notice and disables admin actions", async () => {
    const { default: ProductsPage } = await import("./page");
    const ui = await ProductsPage({ params: Promise.resolve({ shop: "acme" }) });

    render(ui);

    expect(
      screen.getByText("cms.products.viewerNotice"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add new product/i })).toBeNull();
    expect(productsTableRenderSpy).toHaveBeenCalledWith(
      expect.objectContaining({ isAdmin: false }),
    );
    expect(screen.getByTestId("products-table")).toHaveAttribute(
      "data-is-admin",
      "false",
    );
  });
});
