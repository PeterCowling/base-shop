import { render } from "@testing-library/react";

import Section from "../Section";

describe("Section", () => {
  it("applies custom padding and background color", () => {
    const { container } = render(
      <Section padding="2rem" backgroundColor="rgb(255, 0, 0)">
        Content
      </Section>
    );
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveStyle({
      padding: "2rem",
      backgroundColor: "rgb(255, 0, 0)",
    });
  });

  it("forwards id and className to the DOM", () => {
    const { container } = render(
      <Section id="my-section" className="custom-class">
        Content
      </Section>
    );
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveAttribute("id", "my-section");
    expect(section).toHaveClass("custom-class");
  });
});
