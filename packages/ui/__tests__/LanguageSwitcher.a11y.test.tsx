import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSwitcher from "../src/components/molecules/LanguageSwitcher";

describe("LanguageSwitcher keyboard navigation", () => {
  it("moves focus with Tab and activates links with Enter", async () => {
    render(<LanguageSwitcher current="en" />);
    const user = userEvent.setup();

    await user.tab();
    const enLink = screen.getByRole("link", { name: "EN" });
    expect(enLink).toHaveFocus();

    await user.tab();
    const deLink = screen.getByRole("link", { name: "DE" });
    expect(deLink).toHaveFocus();

    const handler = jest.fn((e: Event) => e.preventDefault());
    deLink.addEventListener("click", handler);

    await user.keyboard("{Enter}");

    expect(handler).toHaveBeenCalled();
  });
});
