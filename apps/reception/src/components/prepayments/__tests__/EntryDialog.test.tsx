import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import EntryDialog from "../EntryDialogue";

describe("EntryDialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves new card details", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <EntryDialog
        open
        onClose={vi.fn()}
        onProcessPayment={vi.fn()}
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

  it("validates card input", async () => {
    const onSave = vi.fn();
    const alertMock = vi
      .spyOn(window, "alert")
      .mockImplementation(() => undefined);
    render(
      <EntryDialog
        open
        onClose={vi.fn()}
        onProcessPayment={vi.fn()}
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
    expect(alertMock).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });


  it("calls onClose when cancelled", () => {
    const onClose = vi.fn();
    render(
      <EntryDialog
        open
        onClose={onClose}
        onProcessPayment={vi.fn()}
        onSaveOrUpdate={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
