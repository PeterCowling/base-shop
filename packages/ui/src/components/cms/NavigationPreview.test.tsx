import { render } from "@testing-library/react";
import NavigationPreview from "./NavigationPreview";

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
});
