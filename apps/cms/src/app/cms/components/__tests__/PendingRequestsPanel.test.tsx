import type { PendingUser } from "@cms/actions/accounts.server";
import { approveAccount } from "@cms/actions/accounts.server";
import type { Role } from "@cms/auth/roles";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PendingRequestsPanel } from "../PendingRequestsPanel";

jest.mock("@cms/actions/accounts.server", () => ({
  approveAccount: jest.fn(),
}));

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");

  const Button = React.forwardRef(
    ({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    ),
  );
  Button.displayName = "MockButton";

  const Card = ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  );
  const CardContent = ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  );
  const Checkbox = ({ onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(event: any) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  );
  const Tag = ({ children, variant = "default", ...props }: any) => (
    <span data-variant={variant} {...props}>
      {children}
    </span>
  );

  return { Card, CardContent, Button, Checkbox, Tag };
});

jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, role = "status" }: any) =>
    open ? (
      <div role={role}>
        <span>{message}</span>
      </div>
    ) : null,
}));

describe("PendingRequestsPanel", () => {
  const mockApproveAccount = approveAccount as jest.MockedFunction<
    typeof approveAccount
  >;

  beforeEach(() => {
    mockApproveAccount.mockReset();
  });

  it("displays the empty state when there are no pending requests", () => {
    render(
      <PendingRequestsPanel
        pending={[]}
        roles={[]}
        headingId="account-requests"
      />,
    );

    expect(
      screen.getByText(
        "You are all caught up. New requests will appear here instantly.",
      ),
    ).toBeInTheDocument();

    const statusTag = screen.getByText("No pending approvals");
    expect(statusTag).toHaveAttribute("data-variant", "success");
  });

  it("approves a request and syncs the UI", async () => {
    const user = userEvent.setup();
    const pendingUser: PendingUser = {
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "hashed-password",
    };
    const roles = ["admin", "viewer"] as Role[];
    mockApproveAccount.mockResolvedValueOnce();

    render(
      <PendingRequestsPanel
        pending={[pendingUser]}
        roles={roles}
        headingId="account-requests"
      />,
    );

    const adminCheckbox = screen.getByRole("checkbox", {
      name: "Grant admin role",
    });
    const viewerCheckbox = screen.getByRole("checkbox", {
      name: "Grant viewer role",
    });

    await user.click(adminCheckbox);
    expect(adminCheckbox).toBeChecked();

    await user.click(viewerCheckbox);
    expect(viewerCheckbox).toBeChecked();

    await user.click(viewerCheckbox);
    expect(viewerCheckbox).not.toBeChecked();

    const approveButton = screen.getByRole("button", {
      name: "Approve access",
    });
    const focusSpy = jest.spyOn(approveButton, "focus");

    await user.click(approveButton);

    await waitFor(() => expect(mockApproveAccount).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(focusSpy).toHaveBeenCalled());

    const formData = mockApproveAccount.mock.calls[0][0] as FormData;
    const entries = Array.from(formData.entries());
    expect(entries).toEqual([
      ["id", pendingUser.id],
      ["roles", "admin"],
    ]);

    await waitFor(() =>
      expect(screen.queryByText(pendingUser.name)).not.toBeInTheDocument(),
    );

    expect(
      await screen.findByText(`${pendingUser.name} is now approved.`),
    ).toBeInTheDocument();
    focusSpy.mockRestore();
  });

  it("shows an error toast when approval fails", async () => {
    const user = userEvent.setup();
    const pendingUser: PendingUser = {
      id: "user-2",
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "hashed-password",
    };
    const roles = ["admin", "viewer"] as Role[];
    const error = new Error("Something went wrong");
    mockApproveAccount.mockRejectedValueOnce(error);

    render(
      <PendingRequestsPanel
        pending={[pendingUser]}
        roles={roles}
        headingId="account-requests"
      />,
    );

    const adminCheckbox = screen.getByRole("checkbox", {
      name: "Grant admin role",
    });
    await user.click(adminCheckbox);

    const approveButton = screen.getByRole("button", {
      name: "Approve access",
    });
    const focusSpy = jest.spyOn(approveButton, "focus");

    await user.click(approveButton);

    await waitFor(() => expect(mockApproveAccount).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(focusSpy).toHaveBeenCalled());

    expect(await screen.findByText(error.message)).toBeInTheDocument();
    expect(screen.getByText(pendingUser.name)).toBeInTheDocument();

    focusSpy.mockRestore();
  });

  it("updates rendered requests when the pending prop changes", () => {
    const initialUser: PendingUser = {
      id: "user-3",
      name: "Alan Turing",
      email: "alan@example.com",
      password: "hashed-password",
    };
    const nextUser: PendingUser = {
      id: "user-4",
      name: "Joan Clarke",
      email: "joan@example.com",
      password: "hashed-password",
    };
    const roles = ["admin"] as Role[];

    const { rerender } = render(
      <PendingRequestsPanel
        pending={[initialUser]}
        roles={roles}
        headingId="account-requests"
      />,
    );

    expect(screen.getByText(initialUser.name)).toBeInTheDocument();

    rerender(
      <PendingRequestsPanel
        pending={[nextUser]}
        roles={roles}
        headingId="account-requests"
      />,
    );

    expect(screen.queryByText(initialUser.name)).not.toBeInTheDocument();
    expect(screen.getByText(nextUser.name)).toBeInTheDocument();
  });
});
