import { render, screen } from "@testing-library/react";
import StartReturnButton from "../src/components/account/StartReturnButton";

describe("StartReturnButton", () => {
  it("exposes tokens for styling", () => {
    render(<StartReturnButton sessionId="s1" />);
    const btn = screen.getByRole("button", { name: /start return/i });
    expect(btn).toHaveAttribute("data-token", "--color-primary");
    expect(btn.querySelector("span")).toHaveAttribute(
      "data-token",
      "--color-primary-fg"
    );
  });
});
