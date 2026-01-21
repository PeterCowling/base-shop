import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EntryDialog from "../EntryDialogue";

describe("EntryDialog", () => {
  afterEach(() => {
    jest.restoreAllMocks();
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

  it("validates card input", async () => {
    const onSave = jest.fn();
    const alertMock = vi
      .spyOn(window, "alert")
      .mockImplementation(() => undefined);
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
    expect(alertMock).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
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
