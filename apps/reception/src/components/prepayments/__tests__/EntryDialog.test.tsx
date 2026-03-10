import "@testing-library/jest-dom";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { showToast } from "../../../utils/toastUtils";
import EntryDialog from "../EntryDialogue";

jest.mock("../../../utils/toastUtils", () => ({
  showToast: jest.fn(),
}));

const showToastMock = showToast as unknown as jest.Mock;

describe("EntryDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("saves new card details", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <EntryDialog
        open
        onClose={jest.fn()}
        onProcessPayment={jest.fn()}
        onSaveOrUpdate={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/credit card number/i), {
      target: { value: "4242424242424242" },
    });
    fireEvent.change(screen.getByLabelText(/expiry/i), {
      target: { value: "1230" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save cc details/i }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        cardNumber: "4242 4242 4242 4242",
        expiry: "12/30",
      })
    );
  });

  it("validates card input via toast and does not submit", async () => {
    const onSave = jest.fn();
    render(
      <EntryDialog
        open
        onClose={jest.fn()}
        onProcessPayment={jest.fn()}
        onSaveOrUpdate={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText(/credit card number/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/expiry/i), {
      target: { value: "1299" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save cc details/i }));

    expect(showToastMock).toHaveBeenCalledWith(
      "Card number must be 13-16 digits",
      "error"
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("processes payment and reports paid status", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0.9);

    const onProcessPayment = jest.fn().mockResolvedValue(undefined);

    render(
      <EntryDialog
        open
        initialCardNumber="4242424242424242"
        initialExpiry="12/30"
        onClose={jest.fn()}
        onProcessPayment={onProcessPayment}
        onSaveOrUpdate={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /process payment/i }));

    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(onProcessPayment).toHaveBeenCalledWith("paid")
    );
  });

  it("processes payment and reports failed status", async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0.1);

    const onProcessPayment = jest.fn().mockResolvedValue(undefined);

    render(
      <EntryDialog
        open
        initialCardNumber="4242424242424242"
        initialExpiry="12/30"
        onClose={jest.fn()}
        onProcessPayment={onProcessPayment}
        onSaveOrUpdate={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /process payment/i }));

    await act(async () => {
      jest.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(onProcessPayment).toHaveBeenCalledWith("failed")
    );
  });

  it("calls onClose when cancelled", () => {
    const onClose = jest.fn();
    render(
      <EntryDialog
        open
        onClose={onClose}
        onProcessPayment={jest.fn()}
        onSaveOrUpdate={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
