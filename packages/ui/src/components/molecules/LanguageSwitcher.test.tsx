import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSwitcher from "./LanguageSwitcher";
import { locales } from "@acme/i18n/locales";

const linkMock = jest.fn(
  ({ href, children, ...rest }: any) => React.createElement("a", { href, ...rest }, children),
);

jest.mock("next/link", () => ({
  __esModule: true,
  default: linkMock,
}));

describe("LanguageSwitcher interactions", () => {
  it("navigates when selecting a locale and renders links for all locales", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher current="en" />);

    for (const locale of locales) {
      const link = screen.getByRole("link", { name: locale.toUpperCase() });
      await user.click(link);
      expect(window.location.href).toContain(`/${locale}`);
    }

    expect(linkMock).toHaveBeenCalledTimes(locales.length);
    locales.forEach((locale, index) => {
      expect(linkMock).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({ href: `/${locale}` }),
      );
    });
  });
});
