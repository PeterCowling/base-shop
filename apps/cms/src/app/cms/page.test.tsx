import React from "react";
import { render, screen } from "@testing-library/react";
import { __setMockSession } from "next-auth";
import { listPendingUsers } from "@cms/actions/accounts.server";
import { readRbac } from "@cms/lib/server/rbacStore";
import fs from "fs/promises";

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
    Progress: ({ label }: any) =>
      React.createElement("div", { role: label ? "progressbar" : undefined }, label ?? null),
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
    Checkbox: ({ checked, onCheckedChange, ...props }: any) =>
      React.createElement("input", {
        ...props,
        type: "checkbox",
        checked,
        onChange: () => onCheckedChange?.(!checked),
      }),
  };
});

jest.mock("@cms/actions/accounts.server", () => ({
  approveAccount: jest.fn(),
  listPendingUsers: jest.fn(),
}));

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

jest.mock("@cms/lib/server/rbacStore", () => ({
  readRbac: jest.fn().mockResolvedValue({ users: {} }),
}));

jest.mock("@acme/platform-core/dataRoot", () => ({
  resolveDataRoot: () => "/data",
}));


jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

const mockReaddir = fs.readdir as unknown as jest.Mock;
const mockListPending = listPendingUsers as jest.Mock;

it("shows admin actions when no shops exist", async () => {
  __setMockSession({ user: { role: "admin" } } as any);
  mockReaddir.mockResolvedValueOnce([]);
  mockListPending.mockResolvedValueOnce([]);

  const { default: CmsDashboardPage } = await import("./page");
  render(await CmsDashboardPage());

  expect(
    screen.getByRole("heading", { name: /operate every storefront with confidence/i })
  ).toBeInTheDocument();
  const link = screen.getByRole("link", { name: /create new shop/i });
  expect(link).toHaveAttribute("href", "/cms/configurator");
  expect(screen.getByText(/no storefronts live yet/i)).toBeInTheDocument();
  expect(screen.getAllByText(/no pending approvals/i)).not.toHaveLength(0);
});

it("hides admin controls for non-admin users", async () => {
  __setMockSession({ user: { role: "viewer" } } as any);
  mockReaddir.mockResolvedValueOnce([]);

  const { default: CmsDashboardPage } = await import("./page");
  render(await CmsDashboardPage());

  expect(
    screen.getByText(/only administrators can approve new accounts/i)
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /create new shop/i })).toBeNull();
  expect(mockListPending).not.toHaveBeenCalled();
});
