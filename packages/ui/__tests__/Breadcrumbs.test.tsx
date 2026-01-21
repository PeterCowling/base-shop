import React from "react";
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

  it("falls back to generated keys when labels are complex nodes", () => {
    const items = [
      { label: <strong>Overview</strong> },
      { label: <em>Details</em> },
    ];

    const { container } = render(<Breadcrumbs items={items} />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();

    // No anchors should be rendered because there are no href values
    expect(container.querySelectorAll("a")).toHaveLength(0);

    // Ensure the separator renders between the generated breadcrumb wrappers
    expect(screen.getAllByText("/")).toHaveLength(1);
  });
});
