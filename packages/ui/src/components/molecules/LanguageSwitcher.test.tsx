import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSwitcher from "./LanguageSwitcher";
import { locales } from "@acme/i18n/locales";
import Link from "next/link";

jest.mock("next/link", () => ({
  __esModule: true,
  default: jest.fn(({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children),
  ),
}));

const linkMock = jest.mocked(Link);

describe("LanguageSwitcher interactions", () => {
  it("navigates when selecting a locale and renders links for all locales", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher current="en" />);

    for (const locale of locales) {
      const link = screen.getByRole("link", { name: locale.toUpperCase() });
      await user.click(link);
      expect(link).toHaveAttribute("href", `/${locale}`);
    }

    expect(linkMock).toHaveBeenCalledTimes(locales.length);
    expect(linkMock.mock.calls.map((call) => call[0].href)).toEqual(
      locales.map((locale) => `/${locale}`),
    );
  });
});
