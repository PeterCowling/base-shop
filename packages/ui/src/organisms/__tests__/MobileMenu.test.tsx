/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
import "../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MobileMenu } from "../MobileMenu";

jest.mock("focus-trap-react", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

function renderMenu(setMenuOpen = jest.fn()) {
  return render(
    <MobileMenu menuOpen={true} setMenuOpen={setMenuOpen} lang="en" />
  );
}

describe("MobileMenu rooms accordion", () => {
  it("TC-04: rooms accordion button renders with aria-expanded=false initially", () => {
    renderMenu();
    const button = screen.getByRole("button", { name: /rooms/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("TC-01: clicking Rooms button expands the sub-list", async () => {
    const user = userEvent.setup();
    renderMenu();

    const button = screen.getByRole("button", { name: /rooms/i });
    await user.click(button);

    expect(screen.getByRole("link", { name: "See all rooms" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Double Room" })).toBeInTheDocument();
  });

  it("TC-03: clicking Rooms button again collapses the sub-list", async () => {
    const user = userEvent.setup();
    renderMenu();

    const button = screen.getByRole("button", { name: /rooms/i });
    await user.click(button);
    expect(screen.getByRole("link", { name: "See all rooms" })).toBeInTheDocument();

    await user.click(button);
    expect(screen.queryByRole("link", { name: "See all rooms" })).toBeNull();
  });

  it("TC-02: clicking a sub-link calls setMenuOpen(false)", async () => {
    const user = userEvent.setup();
    const setMenuOpen = jest.fn();
    render(<MobileMenu menuOpen={true} setMenuOpen={setMenuOpen} lang="en" />);

    await user.click(screen.getByRole("button", { name: /rooms/i }));
    await user.click(screen.getByRole("link", { name: "See all rooms" }));

    expect(setMenuOpen).toHaveBeenCalledWith(false);
  });

  it("expanded accordion has 11 sub-links (1 sentinel + 10 rooms)", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: /rooms/i }));

    const subList = screen.getByRole("list", { hidden: false });
    // Only the rooms sub-list — count links within it
    const links = screen.getAllByRole("link").filter((el) =>
      el.getAttribute("href")?.includes("/rooms")
    );
    expect(links).toHaveLength(11);
  });
});
