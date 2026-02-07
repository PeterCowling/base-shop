import { render } from "@testing-library/react";

import NavigationPreview from "../NavigationPreview";

const items = [
  {
    id: "1",
    label: "Parent",
    url: "/parent",
    children: [{ id: "2", label: "Child", url: "/child" }],
  },
];

describe("NavigationPreview", () => {
  it("renders items and children", () => {
    const { getByText } = render(<NavigationPreview items={items} />);
    expect(getByText("Parent")).toBeInTheDocument();
    expect(getByText("Child")).toBeInTheDocument();
  });

  it("renders items with empty labels and URLs gracefully", () => {
    const { getAllByRole } = render(
      <NavigationPreview items={[{ id: "1", label: "", url: "", children: [{ id: "2", label: "", url: "" }] }]} />,
    );
    const links = getAllByRole("link");
    expect(links).toHaveLength(2);
  });

  it("renders item with label but empty URL", () => {
    const { getByRole } = render(
      <NavigationPreview items={[{ id: "1", label: "No URL", url: "" }]} />,
    );
    const link = getByRole("link", { name: "No URL" });
    expect(link).toHaveAttribute("href", "#");
  });

  it("does not render nested list for items without children", () => {
    const { getByText } = render(
      <NavigationPreview items={[{ id: "1", label: "Solo", url: "/solo" }]} />,
    );
    const listItem = getByText("Solo").closest("li");
    expect(listItem?.querySelector("ul")).toBeNull();
  });

  it("renders dropdown menu with child links and tokens", () => {
    const { getByText } = render(<NavigationPreview items={items} />);
    const childLink = getByText("Child");
    expect(childLink).toHaveAttribute("data-token", "--color-fg");
    const dropdownList = childLink.closest("ul");
    expect(dropdownList).toHaveAttribute("data-token", "--color-bg");
    const dropdownContainer = dropdownList?.parentElement;
    expect(dropdownContainer).toHaveClass(
      "absolute",
      "start-0",
      "top-full",
      "min-w-32",
      "flex",
      "flex-col",
      "items-stretch",
      "gap-1",
      "rounded-md",
      "border",
      "border-border-1",
      "bg-surface-2",
      "pointer-events-none",
      "p-2",
      "shadow-elevation-2",
      "opacity-0",
      "transition-opacity",
      "duration-150",
      "ease-out",
      "group-hover:pointer-events-auto",
      "group-hover:opacity-100",
    );
  });
});
