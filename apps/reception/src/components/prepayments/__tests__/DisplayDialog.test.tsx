import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../MarkAsPaidButton", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>paid</button>
  ),
}));
vi.mock("../MarkAsFailedButton", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>failed</button>
  ),
}));

import DisplayDialog from "../DisplayDialogue";

describe("DisplayDialog", () => {
  const baseBooking = {
    bookingRef: "ABC",
    guestId: "1",
    amountToCharge: 50,
    ccCardNumber: "1234",
    ccExpiry: "12/25",
    codes: [],
  };

  it("triggers callbacks for actions", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const onStatus = vi.fn().mockResolvedValue(undefined);
    render(
      <DisplayDialog
        open
        selectedBooking={baseBooking}
        details={{ cardNumber: "1234", expiry: "12/25" }}
        onClose={onClose}
        onEdit={onEdit}
        onPaymentStatus={onStatus}
        setMessage={vi.fn()}
        createPaymentTransaction={vi.fn()}
        logActivity={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("failed"));
    expect(onStatus).toHaveBeenCalledWith("failed");
    fireEvent.click(screen.getByText("paid"));
    expect(onStatus).toHaveBeenCalledWith("paid");
    fireEvent.click(screen.getByText(/edit details/i));
    expect(onEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders disabled button when no card", () => {
    const { container } = render(
      <DisplayDialog
        open
        selectedBooking={{ bookingRef: "XYZ", guestId: "2", amountToCharge: 0, codes: [] }}
        details={{}}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onPaymentStatus={vi.fn()}
        setMessage={vi.fn()}
        createPaymentTransaction={vi.fn()}
        logActivity={vi.fn()}
      />
    );
    const btn = screen.getByText(/mark as failed/i);
    expect(btn).toBeDisabled();
    // container not empty check
    expect(container).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <DisplayDialog
        open={false}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onPaymentStatus={vi.fn()}
        setMessage={vi.fn()}
        createPaymentTransaction={vi.fn()}
        logActivity={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
