import { render, screen } from '@testing-library/react';
import Success from './page';

describe("Success page", () => {
  it("renders thank-you heading and receipt message", async () => {
    const element = await Success();
    render(element);
    expect(
      screen.getByRole("heading", {
        name: /Thanks for your order!/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Check your e-mail for the receipt./i)
    ).toBeInTheDocument();
  });
});
