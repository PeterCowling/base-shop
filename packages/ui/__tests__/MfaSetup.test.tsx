import { render, screen } from "@testing-library/react";

import MfaSetup from "../src/components/account/MfaSetup";

describe("MfaSetup", () => {
  it("renders button with data tokens", () => {
    render(<MfaSetup />);
    const btn = screen.getByRole("button", { name: /generate secret/i });
    expect(btn).toHaveAttribute("data-token", "--color-primary");
    expect(btn.querySelector("span")).toHaveAttribute(
      "data-token",
      "--color-primary-fg"
    );
  });
});
