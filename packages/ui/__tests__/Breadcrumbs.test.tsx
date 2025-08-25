import { render, screen } from "@testing-library/react";
import Breadcrumbs from "../src/components/molecules/Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders anchors and separators", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Category", href: "/category" },
      { label: "Item" },
    ];

    const { container } = render(<Breadcrumbs items={items} />);

    const anchors = container.querySelectorAll("a");
    expect(anchors.length).toBe(2);

    const separators = screen.getAllByText("/");
    expect(separators).toHaveLength(2);
  });
});
