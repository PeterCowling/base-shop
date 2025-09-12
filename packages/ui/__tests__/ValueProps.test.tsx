import { render, screen } from "@testing-library/react";
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

  it("renders provided items", () => {
    const items = [
      { icon: "⭐", title: "Quality", desc: "Top quality" },
    ];
    render(<ValueProps items={items} />);
    expect(screen.getByText("Quality")).toBeInTheDocument();
    expect(screen.getByText("Top quality")).toBeInTheDocument();
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

