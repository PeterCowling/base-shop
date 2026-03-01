import "@testing-library/jest-dom";

import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import EodOverrideModal from "../EodOverrideModal";

// Mock withModalBackground to render children directly
jest.mock("../../../hoc/withModalBackground", () => ({
  withModalBackground: (Component: React.ComponentType<object>) => Component,
}));

// Mock ModalContainer to render children directly
jest.mock("../../bar/orderTaking/modal/ModalContainer", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-container">{children}</div>
  ),
}));

// Mock getUserDisplayName to return user.user_name
jest.mock("../../../lib/roles", () => ({
  getUserDisplayName: (user: { user_name?: string }) => user.user_name ?? "Manager",
}));

/* eslint-disable no-var */
var verifyManagerCredentialsMock: jest.Mock;
/* eslint-enable no-var */

// Relative path from eodChecklist/__tests__/ → ../../services/managerReauth
jest.mock("../../../services/managerReauth", () => {
  verifyManagerCredentialsMock = jest.fn();
  return { verifyManagerCredentials: verifyManagerCredentialsMock };
});

describe("EodOverrideModal", () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderModal() {
    return render(<EodOverrideModal onConfirm={onConfirm} onCancel={onCancel} />);
  }

  it("TC-01: renders with email, password, reason inputs and submit/cancel buttons", () => {
    renderModal();

    expect(screen.getByTestId("eod-override-email")).toBeInTheDocument();
    expect(screen.getByTestId("eod-override-password")).toBeInTheDocument();
    expect(screen.getByTestId("eod-override-reason")).toBeInTheDocument();
    expect(screen.getByTestId("eod-override-submit")).toBeInTheDocument();
    expect(screen.getByTestId("eod-override-cancel")).toBeInTheDocument();
  });

  it("TC-02: empty reason → error message shown; verifyManagerCredentials not called", async () => {
    renderModal();

    fireEvent.change(screen.getByTestId("eod-override-email"), {
      target: { value: "manager@test.com" },
    });
    fireEvent.change(screen.getByTestId("eod-override-password"), {
      target: { value: "secret" },
    });
    // reason left empty

    await act(async () => {
      fireEvent.click(screen.getByTestId("eod-override-submit"));
    });

    expect(screen.getByTestId("eod-override-error")).toHaveTextContent(
      "Override reason is required."
    );
    expect(verifyManagerCredentialsMock).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-03: empty email → error shown; verifyManagerCredentials not called", async () => {
    renderModal();

    fireEvent.change(screen.getByTestId("eod-override-reason"), {
      target: { value: "Safe inaccessible" },
    });
    // email and password left empty

    await act(async () => {
      fireEvent.click(screen.getByTestId("eod-override-submit"));
    });

    expect(screen.getByTestId("eod-override-error")).toHaveTextContent(
      "Email and password are required."
    );
    expect(verifyManagerCredentialsMock).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-04: verifyManagerCredentials returns failure → error shown; onConfirm not called", async () => {
    verifyManagerCredentialsMock.mockResolvedValue({
      success: false,
      error: "Invalid email or password.",
    });

    renderModal();

    fireEvent.change(screen.getByTestId("eod-override-email"), {
      target: { value: "manager@test.com" },
    });
    fireEvent.change(screen.getByTestId("eod-override-password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.change(screen.getByTestId("eod-override-reason"), {
      target: { value: "Safe locked" },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("eod-override-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eod-override-error")).toHaveTextContent(
        "Invalid email or password."
      );
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-05: verifyManagerCredentials returns success → onConfirm called with correct EodOverrideSignoff", async () => {
    verifyManagerCredentialsMock.mockResolvedValue({
      success: true,
      user: { uid: "uid-2", user_name: "alice", roles: ["manager"] },
    });

    renderModal();

    fireEvent.change(screen.getByTestId("eod-override-email"), {
      target: { value: "alice@test.com" },
    });
    fireEvent.change(screen.getByTestId("eod-override-password"), {
      target: { value: "correct" },
    });
    fireEvent.change(screen.getByTestId("eod-override-reason"), {
      target: { value: "Safe locked — key with off-site manager" },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("eod-override-submit"));
    });

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
    expect(onConfirm).toHaveBeenCalledWith({
      overrideManagerName: "alice",
      overrideManagerUid: "uid-2",
      overrideReason: "Safe locked — key with off-site manager",
    });
  });

  it("TC-06: submit button shows 'Verifying...' while isSubmitting is true", async () => {
    let resolveVerify: (value: unknown) => void;
    verifyManagerCredentialsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveVerify = resolve;
      })
    );

    renderModal();

    fireEvent.change(screen.getByTestId("eod-override-email"), {
      target: { value: "manager@test.com" },
    });
    fireEvent.change(screen.getByTestId("eod-override-password"), {
      target: { value: "secret" },
    });
    fireEvent.change(screen.getByTestId("eod-override-reason"), {
      target: { value: "Till not closed" },
    });

    act(() => {
      fireEvent.click(screen.getByTestId("eod-override-submit"));
    });

    // While pending, button should show "Verifying..."
    await waitFor(() => {
      expect(screen.getByTestId("eod-override-submit")).toHaveTextContent(
        "Verifying..."
      );
    });

    // Resolve the promise to clean up
    await act(async () => {
      resolveVerify({ success: false, error: "Test complete" });
    });
  });

  it("TC-07: cancel button clicked → onCancel called", () => {
    renderModal();

    fireEvent.click(screen.getByTestId("eod-override-cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
