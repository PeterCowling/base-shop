import { render } from "@testing-library/react";
import { axe } from "jest-axe";

import { Cover } from "../Cover";

describe("Cover", () => {
  it("applies a screen minimum height by default", async () => {
    const { container } = render(
      <Cover>
        <p>Content</p>
      </Cover>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-screen");

  });

  it("applies alternate minimum heights", () => {
    const { rerender, container } = render(
      <Cover minH="[80vh]">
        <p>Content</p>
      </Cover>
    );
    let wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-[80vh]");

    rerender(
      <Cover minH="[60vh]">
        <p>Content</p>
      </Cover>
    );
    wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-[60vh]");
  });

  it("falls back gracefully for unsupported values", () => {
    const { container } = render(
      <Cover minH={"something-else" as unknown as "screen"}>
        <p>Content</p>
      </Cover>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).not.toMatch(/min-h-\[/);
  });

  it("prefers the center prop when provided", () => {
    const { getByText, queryByText } = render(
      <Cover center={<span>Centered</span>}>
        <span>Children</span>
      </Cover>
    );
    expect(getByText("Centered")).toBeInTheDocument();
    expect(queryByText("Children")).not.toBeInTheDocument();
  });
});
