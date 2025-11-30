import { render, screen } from "@testing-library/react";

const translations = {
  "success.thanks": "Thanks for your order!",
  "success.paymentReceived":
    "Your payment was received. Check your e-mail for the receipt.",
};

const useTranslations = jest.fn();

jest.mock("@i18n/useTranslations.server", () => ({
  useTranslations,
}));

const translator = (key: string) => translations[key as keyof typeof translations] ?? key;

import Success from "../src/app/success/page";

describe("Success page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTranslations.mockResolvedValue(translator);
  });

  it("renders thank-you heading and receipt instructions", async () => {
    render(await Success());

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
