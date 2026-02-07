import React from "react";
import type { UserWithRoles } from "@cms/actions/rbac.server";
import type { Role } from "@cms/auth/roles";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { ActionResult } from "../components/actionResult";
import { ROLE_DETAILS } from "../components/roleDetails";
import RbacManagementPanel, {
  type InviteUserAction,
  type SaveUserAction,
} from "../rbac/RbacManagementPanel.client";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, asChild, ...props }: any) =>
      asChild && React.isValidElement(children)
        ? React.cloneElement(children, props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }: any) =>
      React.createElement("section", props, children),
    CardContent: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    Input: ({ children, ...props }: any) =>
      React.createElement("input", props, children),
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
  };
});

jest.mock("@/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Tooltip: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

const mockToastMessages: { type: string; message: string }[] = [];
jest.mock("@acme/ui/operations", () => ({
  __esModule: true,
  useToast: () => ({
    success: (message: string) => { mockToastMessages.push({ type: "success", message }); },
    error: (message: string) => { mockToastMessages.push({ type: "error", message }); },
    warning: (message: string) => { mockToastMessages.push({ type: "warning", message }); },
    info: (message: string) => { mockToastMessages.push({ type: "info", message }); },
    loading: (message: string) => { mockToastMessages.push({ type: "loading", message }); },
    dismiss: () => {},
    update: () => {},
    promise: async (p: Promise<unknown>) => p,
  }),
}));

const roles: Role[] = [
  "admin",
  "viewer",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
];

beforeEach(() => {
  mockToastMessages.length = 0;
});

describe("RbacManagementPanel", () => {
  const user: UserWithRoles = {
    id: "user-1",
    name: "Jordan Lee",
    email: "jordan@example.com",
    password: "hashed",
    roles: "viewer",
  };

  it("renders user metadata with role badges", () => {
    const save: SaveUserAction = jest.fn();
    const invite: InviteUserAction = jest.fn();
    render(
      <RbacManagementPanel
        users={[user]}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onSaveUser={save}
        onInvite={invite}
      />
    );

    const userCard = screen.getByText("Jordan Lee").closest("section");
    if (!userCard) {
      throw new Error("User card not found");
    }
    const scoped = within(userCard);
    expect(scoped.getByText("Jordan Lee")).toBeInTheDocument();
    expect(scoped.getByText("jordan@example.com")).toBeInTheDocument();
    expect(scoped.getByText(/1 role active/i)).toBeInTheDocument();
    expect(scoped.getByRole("button", { name: /Administrator/i })).toBeInTheDocument();
  });

  it("prevents saving when all roles are cleared and surfaces a toast", async () => {
    const save: SaveUserAction = jest.fn();
    const invite: InviteUserAction = jest.fn();
    render(
      <RbacManagementPanel
        users={[user]}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onSaveUser={save}
        onInvite={invite}
      />
    );

    const userCard = screen.getByText("Jordan Lee").closest("section");
    if (!userCard) {
      throw new Error("User card not found");
    }
    const scoped = within(userCard);

    fireEvent.click(scoped.getByRole("button", { name: /^Viewer$/i }));
    fireEvent.click(scoped.getByRole("button", { name: /Save changes/i }));

    expect(save).not.toHaveBeenCalled();
    expect(mockToastMessages).toContainEqual(
      expect.objectContaining({ type: "error", message: expect.stringMatching(/assign at least one role/i) })
    );
    expect(screen.getByText(/role assignment required/i)).toBeInTheDocument();
  });

  it("submits updated roles and updates the active badge", async () => {
    const save = jest.fn<Promise<ActionResult>, Parameters<SaveUserAction>>(
      async () => ({ status: "success", message: "Roles saved" })
    );
    const invite: InviteUserAction = jest.fn();

    render(
      <RbacManagementPanel
        users={[user]}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onSaveUser={save}
        onInvite={invite}
      />
    );

    const userCard = screen.getByText("Jordan Lee").closest("section");
    if (!userCard) {
      throw new Error("User card not found");
    }
    const scoped = within(userCard);

    fireEvent.click(scoped.getByRole("button", { name: /Administrator/i }));
    fireEvent.click(scoped.getByRole("button", { name: /Save changes/i }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        id: "user-1",
        roles: ["viewer", "admin"],
      })
    );

    await waitFor(() =>
      expect(mockToastMessages).toContainEqual(
        expect.objectContaining({ type: "success", message: expect.stringMatching(/roles saved/i) })
      )
    );
    expect(screen.getByText(/2 roles active/i)).toBeInTheDocument();
  });

  it("invites a new user, resets the form, and appends the entry", async () => {
    const save: SaveUserAction = jest.fn();
    const invite = jest.fn<
      Promise<ActionResult & { user?: UserWithRoles }>,
      Parameters<InviteUserAction>
    >(async () => ({
      status: "success",
      message: "Invite sent",
      user: {
        id: "user-2",
        name: "Alex Kim",
        email: "alex@example.com",
        password: "hashed",
        roles: ["admin"],
      },
    }));

    render(
      <RbacManagementPanel
        users={[user]}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onSaveUser={save}
        onInvite={invite}
      />
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Alex Kim" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/temporary password/i), {
      target: { value: "secret" },
    });
    const inviteCard = screen
      .getByRole("heading", { name: /Invite User/i })
      .closest("section");
    if (!inviteCard) {
      throw new Error("Unable to locate invite card");
    }
    const inviteWithin = within(inviteCard);
    fireEvent.click(inviteWithin.getByRole("button", { name: /Administrator/i }));
    fireEvent.click(inviteWithin.getByRole("button", { name: /Send invite/i }));

    await waitFor(() =>
      expect(invite).toHaveBeenCalledWith({
        name: "Alex Kim",
        email: "alex@example.com",
        password: "secret",
        roles: ["admin"],
      })
    );

    await waitFor(() =>
      expect(mockToastMessages).toContainEqual(
        expect.objectContaining({ type: "success", message: expect.stringMatching(/invite sent/i) })
      )
    );
    expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email/i)).toHaveValue("");
  });
});
