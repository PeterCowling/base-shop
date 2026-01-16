/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import PaymentMethodSelector from "../keycardButton/PaymentMethodSelector";
import { KeycardPayType } from "../../../types/keycards";

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
