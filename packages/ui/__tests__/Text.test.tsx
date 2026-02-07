import { render, screen } from "@testing-library/react";

// Text is exported from the block registry's barrel file, so we can import it
// directly from the `blocks` entry point rather than reaching into the file
// system. This mirrors how consumers would access the component and avoids
// brittle relative paths that omit the `src` directory.
import { Text } from "../src/components/cms/blocks";

describe("Text atom", () => {
  it("renders provided text", () => {
    render(<Text text={{ en: "hello" } as Record<string, string>} locale="en" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("supports custom tag", () => {
    render(<Text text={{ en: "heading" } as Record<string, string>} tag="h2" locale="en" />);
    const el = screen.getByText("heading");
    expect(el.tagName).toBe("H2");
  });

  it("renders correct locale", () => {
    render(<Text text={{ en: "Hi", de: "Hallo" } as Record<string, string>} locale="de" />);
    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });
});
