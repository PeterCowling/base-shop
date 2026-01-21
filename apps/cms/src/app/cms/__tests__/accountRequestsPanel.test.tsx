import React from "react";
import type { PendingUser } from "@cms/actions/accounts.server";
import type { Role } from "@cms/auth/roles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AccountRequestsPanel, {
  type ApproveAction,
} from "../account-requests/AccountRequestsPanel.client";
import { ROLE_DETAILS } from "../components/roleDetails";

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
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
  };
});

jest.mock("@/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Toast: ({ open, message, className }: any) =>
      open
        ? React.createElement(
            "div",
            { role: "status", className },
            message
          )
        : null,
    Tooltip: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

const roles: Role[] = [
  "admin",
  "viewer",
  "ShopAdmin",
  "CatalogManager",
  "ThemeEditor",
];

describe("AccountRequestsPanel", () => {
  const request: PendingUser = {
    id: "req-1",
    name: "Avery Banner",
    email: "avery@example.com",
    password: "hashed",
  };

  it("renders pending requests with metadata, tags, and helper text", () => {
    const approve: ApproveAction = jest.fn();
    render(
      <AccountRequestsPanel
        requests={[request]}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onApprove={approve}
      />
    );

    expect(
      screen.queryByRole("heading", { name: /account requests/i })
    ).toBeNull();
    expect(screen.getByText("Avery Banner")).toBeInTheDocument();
    expect(screen.getByText("avery@example.com")).toBeInTheDocument();
    expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Administrator/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/select at least one role to include with the approval/i)
    ).toBeInTheDocument();
  });

  it("shows a toast when attempting to approve without selecting roles", async () => {
    const approve: ApproveAction = jest.fn();
    render(
      <AccountRequestsPanel
        requests={[request]}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onApprove={approve}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /approve request/i }));

    expect(approve).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("status", {
        name: "",
      })
    ).toHaveTextContent(/select at least one role/i);
  });

  it("submits selected roles and removes the card on success", async () => {
    const approve = jest.fn<ReturnType<ApproveAction>, Parameters<ApproveAction>>(
      async () => ({ status: "success", message: "Approved" })
    );

    render(
      <AccountRequestsPanel
        requests={[request]}
        roles={roles}
        roleDetails={ROLE_DETAILS}
        onApprove={approve}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Administrator/i }));
    fireEvent.click(screen.getByRole("button", { name: /Approve request/i }));

    await waitFor(() =>
      expect(approve).toHaveBeenCalledWith({
        id: "req-1",
        name: "Avery Banner",
        roles: ["admin"],
      })
    );

    await waitFor(() =>
      expect(screen.queryByTestId("account-request-card")).toBeNull()
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/approved/i);
  });
});
