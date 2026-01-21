import { render, screen, within } from "@testing-library/react";

import ValueProps from "../src/components/home/ValueProps";

const translations: Record<string, string> = {};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

beforeEach(() => {
  Object.keys(translations).forEach((k) => delete translations[k]);
});

describe("ValueProps", () => {
  it("renders default items", () => {
    Object.assign(translations, {
      "value.eco.title": "Eco",
      "value.eco.desc": "Eco desc",
      "value.ship.title": "Ship",
      "value.ship.desc": "Ship desc",
      "value.return.title": "Return",
      "value.return.desc": "Return desc",
    });

    render(<ValueProps />);
    expect(screen.getByText("Eco")).toBeInTheDocument();
    expect(screen.getByText("Ship")).toBeInTheDocument();
    expect(screen.getByText("Return")).toBeInTheDocument();
    expect(screen.getByText("Eco desc")).toHaveAttribute(
      "data-token",
      "--color-muted"
    );
  });

  it("renders provided items with and without icons/descriptions", () => {
    const items = [
      { icon: "⭐", title: "Quality", desc: "Top quality" },
      { title: "No Icon", desc: "Text only" } as any,
      { icon: "🔥", title: "No Desc" } as any,
    ];
    render(<ValueProps items={items} />);
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(3);

    expect(within(articles[0]).getByText("⭐")).toBeInTheDocument();
    expect(within(articles[0]).getByText("Quality")).toBeInTheDocument();
    expect(within(articles[0]).getByText("Top quality")).toBeInTheDocument();

    expect(within(articles[1]).getByText("No Icon")).toBeInTheDocument();
    expect(within(articles[1]).getByText("Text only")).toBeInTheDocument();
    expect(
      within(articles[1]).getByText("", { selector: "div" })
    ).toBeEmptyDOMElement();

    expect(within(articles[2]).getByText("🔥")).toBeInTheDocument();
    expect(within(articles[2]).getByText("No Desc")).toBeInTheDocument();
    expect(
      within(articles[2]).getByText("", { selector: "p" })
    ).toBeEmptyDOMElement();

    expect(screen.queryByText("Eco")).toBeNull();
  });

  it("uses default items when passed an empty array", () => {
    Object.assign(translations, {
      "value.eco.title": "Eco",
      "value.eco.desc": "Eco desc",
    });
    render(<ValueProps items={[]} />);
    expect(screen.getByText("Eco")).toBeInTheDocument();
    expect(screen.getByText("Eco desc")).toBeInTheDocument();
  });
});
