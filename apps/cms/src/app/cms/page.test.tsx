import { render, screen } from "@testing-library/react";
import React from "react";
import { getServerSession } from "next-auth";
import { listPendingUsers } from "@cms/actions/accounts.server";
import { readRbac } from "@cms/lib/server/rbacStore";
import fs from "fs/promises";

jest.mock("@/components/atoms/shadcn", () => ({
  Button: ({ children, ...props }: { children?: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@cms/actions/accounts.server", () => ({
  approveAccount: jest.fn(),
  listPendingUsers: jest.fn(),
}));

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

jest.mock("@cms/lib/server/rbacStore", () => ({
  readRbac: jest.fn().mockResolvedValue({ users: {} }),
}));

jest.mock("@platform-core/dataRoot", () => ({
  resolveDataRoot: () => "/data",
}));

jest.mock("@ui/components/templates", () => ({
  DashboardTemplate: ({ stats }: { stats: Array<{ label: string; value: React.ReactNode }> }) => (
    <div data-testid="dashboard">{stats.map((s) => `${s.label}:${s.value}`).join(",")}</div>
  ),
}));

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

afterEach(() => {
  jest.clearAllMocks();
});

const mockSession = getServerSession as jest.Mock;
const mockReaddir = fs.readdir as unknown as jest.Mock;
const mockListPending = listPendingUsers as jest.Mock;

it("shows create shop link for admin when no shops exist", async () => {
  mockSession.mockResolvedValueOnce({ user: { role: "admin" } });
  mockReaddir.mockResolvedValueOnce([]);
  mockListPending.mockResolvedValueOnce([]);

  const { default: CmsDashboardPage } = await import("./page");
  render(await CmsDashboardPage());

  expect(
    screen.getByText("No shops found. Get started by creating your first shop.")
  ).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "Create Shop" });
  expect(link).toHaveAttribute("href", "/cms/configurator");
  expect(screen.getByText("No pending requests.")).toBeInTheDocument();
});

it("hides admin controls for non-admin users", async () => {
  mockSession.mockResolvedValueOnce({ user: { role: "viewer" } });
  mockReaddir.mockResolvedValueOnce([]);

  const { default: CmsDashboardPage } = await import("./page");
  render(await CmsDashboardPage());

  expect(
    screen.getByText("No shops found. Get started by creating your first shop.")
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Create Shop" })).toBeNull();
  expect(screen.queryByText("Account Requests")).toBeNull();
  expect(mockListPending).not.toHaveBeenCalled();
});
