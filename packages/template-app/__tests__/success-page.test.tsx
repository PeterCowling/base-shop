/** @jest-environment jsdom */
import { render } from "@testing-library/react";

describe("Success page", () => {
  it("renders thank you message", async () => {
    const { default: Success } = await import("../src/app/success/page");
    const { getByText } = render(<Success />);
    expect(getByText("Thanks for your order!")).toBeInTheDocument();
    expect(
      getByText("Your payment was received. Check your e-mail for the receipt.")
    ).toBeInTheDocument();
  });
});
