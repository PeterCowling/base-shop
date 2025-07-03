import { render, screen } from "@testing-library/react";
import { Text } from "../components/cms/blocks/atoms";

describe("Text atom", () => {
  it("renders provided text", () => {
    render(<Text text="hello" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("supports custom tag", () => {
    render(<Text text="heading" tag="h2" />);
    const el = screen.getByText("heading");
    expect(el.tagName).toBe("H2");
  });
});
