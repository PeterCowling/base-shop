import { render } from "@testing-library/react";

import { Section } from "../Section";

describe("Section", () => {
  it("keeps custom padding when padding is none", () => {
    const { container } = render(<Section padding="none" className="p-6" />);
    const el = container.firstElementChild as HTMLElement | null;

    expect(el).not.toBeNull();
    expect(el).toHaveClass("p-6");
    expect(el).not.toHaveClass("px-0");
    expect(el).not.toHaveClass("py-0");
  });
});
