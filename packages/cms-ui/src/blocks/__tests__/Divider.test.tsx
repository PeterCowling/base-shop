import { render } from "@testing-library/react";

import Divider from "../Divider";

describe("Divider", () => {
  it("uses height 1px by default", () => {
    const { container } = render(<Divider />);
    expect(container.firstChild).toHaveStyle({ height: "1px" });
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstChild).toHaveClass("bg-border");
  });

  it("applies custom height", () => {
    const { container } = render(<Divider height="5px" />);
    expect(container.firstChild).toHaveStyle({ height: "5px" });
  });
});
