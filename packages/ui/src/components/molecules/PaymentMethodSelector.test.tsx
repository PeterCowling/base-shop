import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useState } from "react";
import { PaymentMethodSelector, type PaymentMethod } from "./PaymentMethodSelector";

// Co-located test to ensure radio selection logic works for multiple methods

describe("PaymentMethodSelector", () => {
  const methods: PaymentMethod[] = [
    { value: "card", label: "Credit Card", icon: <svg data-cy="card-icon" /> },
    { value: "paypal", label: "PayPal", icon: <svg data-cy="paypal-icon" /> },
  ];

  function Wrapper({ onChange }: { onChange: (value: string) => void }) {
    const [value, setValue] = useState("card");
    return (
      <PaymentMethodSelector
        methods={methods}
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange(v);
        }}
      />
    );
  }

  it("updates selection and emits chosen value", () => {
    const handle = jest.fn();
    render(<Wrapper onChange={handle} />);

    // ensure icons render for each method
    expect(screen.getByTestId("card-icon")).toBeInTheDocument();
    expect(screen.getByTestId("paypal-icon")).toBeInTheDocument();

    // select a different payment method
    const paypalRadio = screen.getByLabelText("PayPal") as HTMLInputElement;
    fireEvent.click(paypalRadio);

    expect(handle).toHaveBeenCalledWith("paypal");
    expect(paypalRadio.checked).toBe(true);
  });
});
