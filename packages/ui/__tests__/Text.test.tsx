import { render, screen } from "@testing-library/react";
import { Text } from "../src/components/cms/blocks/atoms";

describe("Text atom", () => {
  it("renders provided text", () => {
    render(<Text text={{ en: "hello" }} locale="en" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("supports custom tag", () => {
    render(<Text text={{ en: "heading" }} tag="h2" locale="en" />);
    const el = screen.getByText("heading");
    expect(el.tagName).toBe("H2");
  });

  it("renders correct locale", () => {
    render(<Text text={{ en: "Hi", de: "Hallo" }} locale="de" />);
    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });
});
