import { render } from "@testing-library/react";

import ContactFormWithMap from "../src/components/cms/blocks/ContactFormWithMap";

describe("ContactFormWithMap", () => {
  it("renders form and iframe", () => {
    const { container } = render(<ContactFormWithMap mapSrc="/map" />);
    expect(container.querySelector("form")).toBeInTheDocument();
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe("/map");
  });
});
