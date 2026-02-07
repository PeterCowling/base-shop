import { render, screen } from "@testing-library/react";

import ValueProps from "../ValueProps";

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("ValueProps", () => {
  it("renders three default items", () => {
    render(<ValueProps />);

    expect(screen.getByText("value.eco.title")).toBeInTheDocument();
    expect(screen.getByText("value.ship.title")).toBeInTheDocument();
    expect(screen.getByText("value.return.title")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("renders provided items instead of defaults", () => {
    const items = [
      { icon: "⭐", title: "Quality", desc: "Top quality" },
      { icon: "🔥", title: "Speed", desc: "Fast shipping" },
      { icon: "🎉", title: "Fun", desc: "Enjoy" },
    ];

    render(<ValueProps items={items} />);

    for (const { title, desc } of items) {
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(desc)).toBeInTheDocument();
    }

    expect(screen.queryByText("value.eco.title")).toBeNull();
    expect(screen.queryByText("value.ship.title")).toBeNull();
    expect(screen.queryByText("value.return.title")).toBeNull();
  });
});

