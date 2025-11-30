import React from "react";
import { render, screen } from "@testing-library/react";

const checkShopExistsMock = jest.fn();
jest.mock("@acme/lib", () => ({
  __esModule: true,
  checkShopExists: checkShopExistsMock,
}));

// Centralized NextAuth mock control
function setSession(session: any) {
  const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
  __setMockSession(session);
}

jest.mock("@cms/auth/options", () => ({
  __esModule: true,
  authOptions: {},
}));

const readRepoMock = jest.fn();
jest.mock("@platform-core/repositories/json.server", () => ({
  __esModule: true,
  readRepo: readRepoMock,
}));

const createDraftMock = jest.fn();
const duplicateProductMock = jest.fn();
const deleteProductMock = jest.fn();
jest.mock("@cms/actions/products.server", () => ({
  __esModule: true,
  createDraft: createDraftMock,
  duplicateProduct: duplicateProductMock,
  deleteProduct: deleteProductMock,
}));

const notFoundMock = jest.fn();
jest.mock("next/navigation", () => ({
  __esModule: true,
  notFound: notFoundMock,
}));

jest.mock("next/link", () => {
  const React = require("react");
  const Link = React.forwardRef(
    (
      { children, href, ...props }: any,
      ref: React.Ref<HTMLAnchorElement>,
    ) => React.createElement("a", { ref, href, ...props }, children),
  );
  Link.displayName = "Link";
  return {
    __esModule: true,
    default: Link,
  };
});

const progressMock = jest.fn(
  ({ value, label }: { value: number; label: string }) => (
    <div data-testid="progress" data-value={value} data-label={label}>
      {label}
    </div>
  ),
);

jest.mock("@ui/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Alert: ({ heading, children, ...props }: any) =>
      React.createElement(
        "div",
        { role: "alert", ...props },
        heading ?? children ?? null,
      ),
    Progress: (props: any) => progressMock(props),
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
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

const productsTableMock = jest.fn((props: any) => (
  <div data-testid="products-table" data-shop={props.shop} />
));
jest.mock("@ui/components/cms/ProductsTable.client", () => ({
  __esModule: true,
  default: productsTableMock,
}));

import ProductsPage from "../src/app/cms/shop/[shop]/products/page";

type FormAction = (...args: any[]) => unknown | Promise<unknown>;

function findFormAction(node: React.ReactNode): FormAction | undefined {
  if (!node) return undefined;

  if (Array.isArray(node)) {
    for (const child of node) {
      const action = findFormAction(child);
      if (action) return action;
    }
    return undefined;
  }

  if (React.isValidElement(node)) {
    if (node.type === "form" && typeof node.props.action === "function") {
      return node.props.action;
    }

    return findFormAction(React.Children.toArray(node.props.children));
  }

  return undefined;
}

describe("ProductsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the admin view with actions wired", async () => {
    const shop = "demo-shop";
    const rows = [
      { id: "prod-active", status: "active" },
      { id: "prod-draft", status: "draft" },
      { id: "prod-scheduled", status: "scheduled" },
      { id: "prod-archived", status: "archived" },
    ];

    checkShopExistsMock.mockResolvedValue(true);
    setSession({ user: { role: "admin" } });
    readRepoMock.mockResolvedValue(rows);
    createDraftMock.mockResolvedValue(undefined);
    duplicateProductMock.mockResolvedValue(undefined);
    deleteProductMock.mockResolvedValue(undefined);

    const element = await ProductsPage({
      params: Promise.resolve({ shop }),
    });

    const onCreate = findFormAction(element);
    expect(typeof onCreate).toBe("function");

    render(element);

    expect(
      screen.getByRole("heading", {
        name: `Shape every product story for ${shop.toUpperCase()}`,
      }),
    ).toBeInTheDocument();

    expect(progressMock).toHaveBeenCalled();
    const progressProps = progressMock.mock.calls[0]?.[0];
    expect(progressProps).toBeDefined();
    expect(progressProps).toMatchObject({
      value: 25,
      label: "1/4 products live",
    });

    expect(
      screen.queryByText(
        /you are signed in as a viewer. editing actions like create, duplicate, or delete are disabled\./i,
      ),
    ).not.toBeInTheDocument();

    expect(productsTableMock).toHaveBeenCalledTimes(1);
    const tableProps = productsTableMock.mock.calls[0]?.[0];
    expect(tableProps).toBeDefined();
    if (!tableProps) throw new Error("Expected products table props");
    expect(tableProps).toMatchObject({
      shop,
      rows,
      isAdmin: true,
    });

    await tableProps.onDuplicate(shop, rows[0].id);
    expect(duplicateProductMock).toHaveBeenCalledWith(shop, rows[0].id);

    await tableProps.onDelete(shop, rows[1].id);
    expect(deleteProductMock).toHaveBeenCalledWith(shop, rows[1].id);

    if (!onCreate) throw new Error("Expected onCreate action");
    await onCreate();
    expect(createDraftMock).toHaveBeenCalledWith(shop);
  });

  it("shows viewer notice and hides admin affordances for non-admins", async () => {
    const shop = "demo-shop";
    const rows = [
      { id: "prod-active", status: "active" },
      { id: "prod-draft", status: "draft" },
    ];

    checkShopExistsMock.mockResolvedValue(true);
    setSession({ user: { role: "viewer" } });
    readRepoMock.mockResolvedValue(rows);

    const element = await ProductsPage({
      params: Promise.resolve({ shop }),
    });

    render(element);

    expect(
      screen.getByText(
        /you are signed in as a viewer. editing actions like create, duplicate, or delete are disabled\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add new product/i }),
    ).not.toBeInTheDocument();

    const tableProps = productsTableMock.mock.calls[0]?.[0];
    expect(tableProps).toBeDefined();
    if (!tableProps) throw new Error("Expected products table props");
    expect(tableProps.isAdmin).toBe(false);
  });

  it("redirects to notFound when the shop is missing", async () => {
    checkShopExistsMock.mockResolvedValue(false);

    await ProductsPage({
      params: Promise.resolve({ shop: "missing-shop" }),
    });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(readRepoMock).not.toHaveBeenCalled();
  });
});
