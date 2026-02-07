import { render, screen } from "@testing-library/react";

import type { Locale } from "@acme/i18n";

import Success from "./page";

describe('Success page (localized)', () => {
  it("renders thank-you heading and receipt message", async () => {
    const ui = await Success({ params: { lang: "en" as Locale } });
    render(ui);
    expect(
      screen.getByRole('heading', {
        name: /Thanks for your order!/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Check your e-mail for the receipt./i)
    ).toBeInTheDocument();
  });
});
