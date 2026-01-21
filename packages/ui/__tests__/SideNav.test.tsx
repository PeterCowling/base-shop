import { render } from "@testing-library/react";

import { SideNav } from "../src/components/organisms/SideNav";

describe("SideNav", () => {
  it("has default width and token", () => {
    const { container } = render(<SideNav />);
    const aside = container.firstChild as HTMLElement;
    expect(aside).toHaveClass("w-48");
    expect(aside).toHaveAttribute("data-token", "--color-bg");
  });

  it("accepts a custom width class", () => {
    const { container } = render(<SideNav width="w-72" />);
    expect(container.firstChild).toHaveClass("w-72");
  });
});
