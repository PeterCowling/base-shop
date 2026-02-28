/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
import "../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DesktopHeader from "../DesktopHeader";

jest.mock("../../molecules/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

jest.mock("../../molecules/LanguageSwitcher", () => ({
  LanguageSwitcher: () => null,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      getFixedT: () => (key: string) => key,
      hasResourceBundle: () => false,
    },
    ready: true,
  }),
}));

describe("DesktopHeader rooms dropdown", () => {
  it("renders a sub-menu trigger button only for the Rooms nav item", () => {
    render(<DesktopHeader lang="en" />);
    const triggers = screen.getAllByRole("button", { name: /sub-menu/i });
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toHaveAttribute("aria-label", "Rooms sub-menu");
  });

  it("TC-01: clicking the trigger opens the panel with 11 items", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    const trigger = screen.getByRole("button", { name: "Rooms sub-menu" });
    await user.click(trigger);

    const items = screen.getAllByRole("menuitem");
    expect(items.length).toBe(11);
  });

  it("TC-03: Double Room sub-link renders with correct href", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    await user.click(screen.getByRole("button", { name: "Rooms sub-menu" }));

    const doubleRoomLink = screen.getByRole("menuitem", { name: "Double Room" });
    // rooms slug in English is "dorms" (slug-map.ts: rooms.en = "dorms")
    expect(doubleRoomLink).toHaveAttribute("href", "/en/dorms/double_room");
  });

  it("See-all-rooms sentinel is the first menuitem", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    await user.click(screen.getByRole("button", { name: "Rooms sub-menu" }));

    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveTextContent("See all rooms");
  });

  it("Escape closes the open dropdown", async () => {
    const user = userEvent.setup();
    render(<DesktopHeader lang="en" />);

    await user.click(screen.getByRole("button", { name: "Rooms sub-menu" }));
    expect(screen.getAllByRole("menuitem").length).toBeGreaterThan(0);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it.todo("entering portal panel clears close timer — manual browser test required");
});
