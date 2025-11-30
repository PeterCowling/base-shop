import { render, screen } from "@testing-library/react";

describe("Success page", () => {
  it("renders thank-you heading and receipt message", async () => {
    const { default: Success } = await import("./page");
    const ui = await Success();
    render(ui);

    expect(
      screen.getByRole("heading", { name: /Thanks for your order!/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Check your e-mail for the receipt./i)
    ).toBeInTheDocument();
  });
});
