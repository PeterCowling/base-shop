import { render, screen } from "@testing-library/react";
import LanguageSwitcher from "../LanguageSwitcher";
import { locales } from "@acme/i18n/locales";
import "../../../../../../test/resetNextMocks";

describe("LanguageSwitcher", () => {
  it("highlights the current locale", () => {
    const current = locales[0];
    render(<LanguageSwitcher current={current} />);
    const active = screen.getByRole("link", { name: current.toUpperCase() });
    expect(active).toHaveClass("font-semibold");
    expect(active).toHaveClass("underline");

    if (locales.length > 1) {
      const other = locales.find((l) => l !== current)!;
      const inactive = screen.getByRole("link", { name: other.toUpperCase() });
      expect(inactive).toHaveClass("text-muted");
      expect(inactive).not.toHaveClass("font-semibold");
    }
  });

  it("renders a link for each locale", () => {
    render(<LanguageSwitcher current="en" />);
    locales.forEach((locale) => {
      const link = screen.getByRole("link", { name: locale.toUpperCase() });
      expect(link).toHaveAttribute("href", `/${locale}`);
    });
  });
});
