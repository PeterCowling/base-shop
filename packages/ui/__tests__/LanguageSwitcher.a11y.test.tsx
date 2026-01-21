import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LanguageSwitcher from "../src/components/molecules/LanguageSwitcher";

describe("LanguageSwitcher keyboard navigation", () => {
  it("focuses the English link and activates it with Enter", async () => {
    render(<LanguageSwitcher current="en" />);
    const user = userEvent.setup();

    await user.tab();
    const links = screen.getAllByRole("link");
    const enLink = screen.getByRole("link", { name: "EN" });

    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(enLink).toHaveFocus();

    const handler = jest.fn((e: Event) => e.preventDefault());
    enLink.addEventListener("click", handler);

    await user.keyboard("{Enter}");

    expect(handler).toHaveBeenCalled();
  });
});
