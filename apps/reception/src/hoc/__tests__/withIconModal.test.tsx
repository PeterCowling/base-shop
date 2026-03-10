/**
 * Tests for the real withIconModal HOC (no mock) to verify:
 *   - permissionKey → interactive flag derived from authUser roles (TC-05, TC-06)
 *   - peteOnly items hidden for non-Pete users
 *
 * This test is in a separate file because Modals.test.tsx mocks
 * withIconModal at module level and cannot test the real HOC behaviour.
 */
import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import { Home } from "lucide-react";

import { Permissions } from "../../lib/roles";
import { isStaffAccountsPeteIdentity } from "../../lib/staffAccountsAccess";
import type { User } from "../../types/domains/userDomain";
import { withIconModal } from "../withIconModal";

// ──────────────────────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────────────────────

// next/navigation — useRouter is called inside the HOC rendered component
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// SimpleModal — render children directly; no portal issues
jest.mock("@acme/ui/molecules", () => ({
  SimpleModal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-cy="simple-modal">{children}</div> : null,
}));

// Design system atoms/primitives
jest.mock("@acme/design-system/atoms", () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
jest.mock("@acme/design-system/primitives", () => ({
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@acme/design-system/utils/style", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));

// staffAccountsAccess — control peteOnly filtering
jest.mock("../../lib/staffAccountsAccess", () => ({
  isStaffAccountsPeteIdentity: jest.fn(() => false),
}));

// AuthContext — injectable via a variable so each test can control the user
let mockAuthUser: User | null = null;

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: mockAuthUser }),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeUser(roles: User["roles"]): User {
  return {
    uid: "test-uid",
    email: "test@example.com",
    user_name: "Tester",
    roles,
  } as User;
}

const modalActions = [
  { label: "Dashboard", icon: Home, route: "/" },
];

const peteOnlyActions = [
  {
    label: "Staff Accounts",
    icon: Home,
    route: "/staff-accounts",
    permission: Permissions.USER_MANAGEMENT,
    peteOnly: true,
  },
];

function renderModal(options: {
  permissionKey?: typeof Permissions[keyof typeof Permissions];
  actions?: typeof modalActions;
}) {
  const Modal = withIconModal({
    label: "TEST",
    actions: options.actions ?? modalActions,
    permissionKey: options.permissionKey,
  });
  return render(
    <Modal
      visible
      onClose={() => undefined}
      onLogout={() => undefined}
      user={{ email: "test@example.com", user_name: "Tester" }}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe("withIconModal — permissionKey interactive gating (TC-05, TC-06)", () => {
  beforeEach(() => {
    mockAuthUser = null;
    (isStaffAccountsPeteIdentity as jest.Mock).mockReturnValue(false);
  });

  // TC-06: interactive=true when authUser has permissionKey roles
  it("renders buttons as enabled when authUser has required roles", () => {
    mockAuthUser = makeUser(["staff"]);
    renderModal({ permissionKey: Permissions.TILL_ACCESS });

    const buttons = screen.getAllByRole("button");
    buttons.forEach((b) => {
      expect(b).not.toBeDisabled();
    });
  });

  // TC-05: interactive=false when authUser lacks permissionKey roles
  it("renders action buttons as disabled when authUser lacks required roles", () => {
    mockAuthUser = makeUser([]);
    renderModal({ permissionKey: Permissions.MANAGEMENT_ACCESS });

    const disabledButtons = screen
      .getAllByRole("button")
      .filter((b) => b.hasAttribute("disabled"));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it("renders interactive when no permissionKey is set (OperationsModal / ManagementModal pattern)", () => {
    mockAuthUser = makeUser([]);
    renderModal({ permissionKey: undefined });

    const buttons = screen.getAllByRole("button");
    const disabledButtons = buttons.filter((b) => b.hasAttribute("disabled"));
    expect(disabledButtons).toHaveLength(0);
  });
});

describe("withIconModal — peteOnly filtering", () => {
  beforeEach(() => {
    mockAuthUser = makeUser(["owner"]);
  });

  it("hides peteOnly items for non-Pete users", () => {
    (isStaffAccountsPeteIdentity as jest.Mock).mockReturnValue(false);
    renderModal({ actions: peteOnlyActions });
    expect(screen.queryByText("Staff Accounts")).not.toBeInTheDocument();
  });

  it("shows peteOnly items for Pete identity", () => {
    (isStaffAccountsPeteIdentity as jest.Mock).mockReturnValue(true);
    renderModal({ actions: peteOnlyActions });
    expect(screen.getByText("Staff Accounts")).toBeInTheDocument();
  });
});
