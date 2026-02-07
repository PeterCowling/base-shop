import { render } from "@testing-library/react";

import Spacer from "../Spacer";

describe("Spacer", () => {
  it("uses height 1rem by default", () => {
    const { container } = render(<Spacer />);
    expect(container.firstChild).toHaveStyle({ height: "1rem" });
  });

  it("applies custom height", () => {
    const { container } = render(<Spacer height="2rem" />);
    expect(container.firstChild).toHaveStyle({ height: "2rem" });
  });

  it("is aria-hidden", () => {
    const { container } = render(<Spacer />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
