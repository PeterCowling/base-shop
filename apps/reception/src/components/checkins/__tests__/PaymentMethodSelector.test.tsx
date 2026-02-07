import "@testing-library/jest-dom";

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KeycardPayType } from "../../../types/keycards";
import PaymentMethodSelector from "../keycardButton/PaymentMethodSelector";

function Wrapper() {
  const [payType, setPayType] = useState<KeycardPayType>(KeycardPayType.CASH);
  return <PaymentMethodSelector payType={payType} setPayType={setPayType} />;
}

describe("PaymentMethodSelector", () => {
  it("updates selected payment method", async () => {
    render(<Wrapper />);
    const docRadio = screen.getByLabelText(/Doc/i);
    await userEvent.click(docRadio);
    expect(docRadio).toBeChecked();
  });
});
