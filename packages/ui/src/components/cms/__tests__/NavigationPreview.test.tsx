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

  it("applies style prop to nav element", () => {
    const { container } = render(
      <NavigationPreview items={items} style={{ backgroundColor: "red" }} />,
    );
    const nav = container.querySelector("nav");
    expect(nav).toHaveStyle({ backgroundColor: "red" });
  });

  it("renders defaults when label or url missing", () => {
    const { getAllByRole } = render(
      <NavigationPreview items={[{ id: "1", children: [{ id: "2" }] }]} />,
    );
    const links = getAllByRole("link", { name: "Item" });
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "#");
    });
  });

  it("defaults href to '#' when url is missing", () => {
    const { getByRole } = render(
      <NavigationPreview items={[{ id: "1", label: "No URL" }]} />,
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
    const dropdown = childLink.closest("ul");
    expect(dropdown).toHaveAttribute("data-token", "--color-bg");
    expect(dropdown).toHaveClass(
      "absolute",
      "left-0",
      "top-full",
      "hidden",
      "min-w-[8rem]",
      "flex-col",
      "rounded-md",
      "border",
      "bg-background",
      "p-2",
      "shadow-md",
      "group-hover:flex",
    );
  });
});
