import "@testing-library/jest-dom";

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { type PaymentMethod,PaymentMethodSelector } from "../PaymentMethodSelector";

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

  it("fires onChange with the selected value and renders icons", async () => {
    const handle = jest.fn();
    const { container } = render(<Wrapper onChange={handle} />);

    expect(screen.getByTestId("card-icon")).toBeInTheDocument();
    expect(screen.getByTestId("paypal-icon")).toBeInTheDocument();

    const paypalRadio = screen.getByLabelText("PayPal") as HTMLInputElement;
    fireEvent.click(paypalRadio);

    expect(handle).toHaveBeenCalledWith("paypal");

    expect(paypalRadio.checked).toBe(true);
  });
});
