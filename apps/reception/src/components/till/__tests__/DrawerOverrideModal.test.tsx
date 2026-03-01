import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DrawerOverrideModal from "../DrawerOverrideModal";

jest.mock("../../../hoc/withModalBackground", () => ({
  withModalBackground: (Comp: React.ComponentType) => Comp,
}));

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));

const mockVerifyManagerCredentials = jest.fn();
jest.mock("../../../services/managerReauth", () => ({
  verifyManagerCredentials: (...args: [string, string]) =>
    mockVerifyManagerCredentials(...args),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe("DrawerOverrideModal", () => {
  it("TC-01: renders with correct shift owner name and empty fields", () => {
    render(
      <DrawerOverrideModal
        shiftOwnerName="Bob"
        shiftOwnerUid="bob-uid"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByTestId("drawer-override-email")).toHaveValue("");
    expect(screen.getByTestId("drawer-override-password")).toHaveValue("");
    expect(screen.getByTestId("drawer-override-reason")).toHaveValue("");
  });

  it("TC-02: submit with empty email and password shows validation error", async () => {
    const onConfirm = jest.fn();
    render(
      <DrawerOverrideModal
        shiftOwnerName="Bob"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.click(screen.getByTestId("drawer-override-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email and password are required."
      );
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-03: submit with empty reason shows validation error", async () => {
    const onConfirm = jest.fn();
    render(
      <DrawerOverrideModal
        shiftOwnerName="Bob"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(
      screen.getByTestId("drawer-override-email"),
      "manager@test.com"
    );
    await userEvent.type(
      screen.getByTestId("drawer-override-password"),
      "password123"
    );
    await userEvent.click(screen.getByTestId("drawer-override-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Override reason is required."
      );
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-04: failed verifyManagerCredentials shows error and keeps modal open", async () => {
    mockVerifyManagerCredentials.mockResolvedValue({
      success: false,
      error: "Invalid email or password.",
    });

    const onConfirm = jest.fn();
    render(
      <DrawerOverrideModal
        shiftOwnerName="Bob"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(
      screen.getByTestId("drawer-override-email"),
      "manager@test.com"
    );
    await userEvent.type(
      screen.getByTestId("drawer-override-password"),
      "wrongpassword"
    );
    await userEvent.type(
      screen.getByTestId("drawer-override-reason"),
      "Staff left early"
    );
    await userEvent.click(screen.getByTestId("drawer-override-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid email or password."
      );
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-05: same-user block (UID match) shows error", async () => {
    mockVerifyManagerCredentials.mockResolvedValue({
      success: true,
      user: { uid: "bob-uid", displayName: "Bob", email: "bob@test.com" },
    });

    const onConfirm = jest.fn();
    render(
      <DrawerOverrideModal
        shiftOwnerName="Bob"
        shiftOwnerUid="bob-uid"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(
      screen.getByTestId("drawer-override-email"),
      "bob@test.com"
    );
    await userEvent.type(
      screen.getByTestId("drawer-override-password"),
      "password123"
    );
    await userEvent.type(
      screen.getByTestId("drawer-override-reason"),
      "Test reason"
    );
    await userEvent.click(screen.getByTestId("drawer-override-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "You cannot override your own shift."
      );
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-06: successful auth calls onConfirm with correct DrawerOverride shape", async () => {
    mockVerifyManagerCredentials.mockResolvedValue({
      success: true,
      user: { uid: "mgr-uid", displayName: "Manager", email: "mgr@test.com" },
    });

    const onConfirm = jest.fn();
    render(
      <DrawerOverrideModal
        shiftOwnerName="Bob"
        shiftOwnerUid="bob-uid"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(
      screen.getByTestId("drawer-override-email"),
      "mgr@test.com"
    );
    await userEvent.type(
      screen.getByTestId("drawer-override-password"),
      "password123"
    );
    await userEvent.type(
      screen.getByTestId("drawer-override-reason"),
      "Staff left early"
    );
    await userEvent.click(screen.getByTestId("drawer-override-submit"));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          overriddenBy: "Manager",
          overriddenByUid: "mgr-uid",
          overrideReason: "Staff left early",
          overriddenAt: expect.any(String),
        })
      );
    });
  });

  it("TC-07: cancel button calls onCancel", async () => {
    const onCancel = jest.fn();
    render(
      <DrawerOverrideModal
        shiftOwnerName="Bob"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByTestId("drawer-override-cancel"));

    expect(onCancel).toHaveBeenCalled();
  });
});
