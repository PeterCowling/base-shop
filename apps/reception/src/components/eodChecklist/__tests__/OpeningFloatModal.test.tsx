import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import OpeningFloatModal from "../OpeningFloatModal";

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

// Mock settings so standardFloat defaults to 0 (no env var set)
jest.mock("../../../constants/settings", () => ({
  settings: { standardFloat: 0 },
}));

/* eslint-disable no-var */
var showToastMock: jest.Mock;
/* eslint-enable no-var */

// Mock toastUtils using hoistable var
jest.mock("../../../utils/toastUtils", () => {
  showToastMock = jest.fn();
  return { showToast: showToastMock };
});

describe("OpeningFloatModal", () => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onConfirm.mockResolvedValue(undefined);
  });

  function renderModal() {
    return render(<OpeningFloatModal onConfirm={onConfirm} onClose={onClose} />);
  }

  it("TC-01: renders with title 'Set Opening Float' and amount input", () => {
    renderModal();
    expect(screen.getByText("Set Opening Float")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount (€)")).toBeInTheDocument();
  });

  it("TC-01b: amount input is empty when standardFloat is 0", () => {
    renderModal();
    const input = screen.getByPlaceholderText("Amount (€)") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("TC-02: valid amount entered — onConfirm called with parsed number", async () => {
    renderModal();
    const input = screen.getByPlaceholderText("Amount (€)");
    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.click(screen.getByText("Confirm float"));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(50);
    });
  });

  it("TC-03: negative amount — error toast shown, onConfirm not called", () => {
    renderModal();
    const input = screen.getByPlaceholderText("Amount (€)");
    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.click(screen.getByText("Confirm float"));
    expect(showToastMock).toHaveBeenCalledWith(
      "Amount must be zero or greater",
      "error"
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-04: non-numeric input — error toast shown, onConfirm not called", () => {
    renderModal();
    const input = screen.getByPlaceholderText("Amount (€)");
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.click(screen.getByText("Confirm float"));
    expect(showToastMock).toHaveBeenCalledWith(
      "Amount must be zero or greater",
      "error"
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("TC-05: zero amount is valid — onConfirm(0) called", async () => {
    renderModal();
    const input = screen.getByPlaceholderText("Amount (€)");
    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.click(screen.getByText("Confirm float"));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(0);
    });
  });

  it("TC-06: close button calls onClose", () => {
    renderModal();
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
