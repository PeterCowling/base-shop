import { render } from "@testing-library/react";

import ContactFormWithMap from "../ContactFormWithMap";

const DEFAULT_SRC =
  "https://www.google.com/maps/embed/v1/place?key=&q=Hostel+Brikette+Positano+Italy&zoom=13";

describe("ContactFormWithMap", () => {
  it("renders form and iframe with default mapSrc in a grid", () => {
    const { container, getByTitle } = render(<ContactFormWithMap />);
    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveClass("grid");
    const children = Array.from(grid.children);
    expect(children).toHaveLength(2);
    expect(children[0].tagName).toBe("FORM");
    expect(children[1].tagName).toBe("IFRAME");
    expect(getByTitle(/map/i)).toHaveAttribute("src", DEFAULT_SRC);
  });

  it("allows overriding the mapSrc", () => {
    const customSrc = "https://maps.google.com/maps?q=Paris";
    const { getByTitle } = render(
      <ContactFormWithMap mapSrc={customSrc} />,
    );
    expect(getByTitle(/map/i)).toHaveAttribute("src", customSrc);
  });
});
