import { render, screen } from "@testing-library/react";
import Success from "../src/app/success/page";

describe("Success page", () => {
  it("renders thank-you heading and receipt instructions", () => {
    render(<Success />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Thanks for your order!",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Your payment was received. Check your e-mail for the receipt.")
    ).toBeInTheDocument();
  });
});
