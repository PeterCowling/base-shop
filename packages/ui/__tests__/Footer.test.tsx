import { render, screen } from "@testing-library/react";

import Footer from "../src/components/layout/Footer";

describe("Footer", () => {
  it("includes data-token for muted color", () => {
    render(<Footer />);
    expect(screen.getByText("Privacy").closest("footer")).toHaveAttribute(
      "data-token",
      "--color-muted"
    );
  });
});
