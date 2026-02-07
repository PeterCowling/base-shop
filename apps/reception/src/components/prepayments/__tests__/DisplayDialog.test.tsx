import "@testing-library/jest-dom";

import { fireEvent,render, screen } from "@testing-library/react";

import DisplayDialog from "../DisplayDialogue";

jest.mock("../MarkAsPaidButton", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>paid</button>
  ),
}));
jest.mock("../MarkAsFailedButton", () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>failed</button>
  ),
}));

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
    const onClose = jest.fn();
    const onEdit = jest.fn();
    const onStatus = jest.fn().mockResolvedValue(undefined);
    render(
      <DisplayDialog
        open
        selectedBooking={baseBooking}
        details={{ cardNumber: "1234", expiry: "12/25" }}
        onClose={onClose}
        onEdit={onEdit}
        onPaymentStatus={onStatus}
        setMessage={jest.fn()}
        createPaymentTransaction={jest.fn()}
        logActivity={jest.fn()}
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
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onPaymentStatus={jest.fn()}
        setMessage={jest.fn()}
        createPaymentTransaction={jest.fn()}
        logActivity={jest.fn()}
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
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onPaymentStatus={jest.fn()}
        setMessage={jest.fn()}
        createPaymentTransaction={jest.fn()}
        logActivity={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
