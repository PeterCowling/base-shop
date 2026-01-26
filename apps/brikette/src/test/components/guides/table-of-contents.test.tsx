import "@testing-library/jest-dom";

import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@tests/renderers";

import TableOfContents from "@/components/guides/TableOfContents";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      if (options?.defaultValue) return options.defaultValue;
      return key;
    },
  }),
}));

describe("<TableOfContents />", () => {
  const items = [
    { href: "#intro", label: "Intro" },
    { href: "#details", label: "Details" },
  ];

  it("renders a nav with the default title", () => {
    renderWithProviders(<TableOfContents items={items} />);

    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute("data-title", "On this page");
  });

  it("marks the clicked link as the current location", () => {
    renderWithProviders(<TableOfContents items={items} />);

    const introLink = screen.getByRole("link", { name: "Intro" });
    const detailsLink = screen.getByRole("link", { name: "Details" });

    fireEvent.click(introLink);

    expect(introLink).toHaveAttribute("aria-current", "location");
    expect(detailsLink).not.toHaveAttribute("aria-current");
  });
});
