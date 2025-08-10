import { render, screen } from "@testing-library/react";
import LanguageSwitcher from "../LanguageSwitcher";
import { locales } from "@/i18n/locales";
import "../../../../../../test/resetNextMocks";

describe("LanguageSwitcher", () => {
  it("highlights the current locale", () => {
    render(<LanguageSwitcher current="de" />);
    const active = screen.getByRole("link", { name: "DE" });
    expect(active).toHaveClass("font-semibold");
    expect(active).toHaveClass("underline");

    const inactive = screen.getByRole("link", { name: "EN" });
    expect(inactive).toHaveClass("text-muted");
    expect(inactive).not.toHaveClass("font-semibold");
  });

  it("renders a link for each locale", () => {
    render(<LanguageSwitcher current="en" />);
    locales.forEach((locale) => {
      const link = screen.getByRole("link", { name: locale.toUpperCase() });
      expect(link).toHaveAttribute("href", `/${locale}`);
    });
  });
});
