import { render, screen, fireEvent } from "@testing-library/react";
import GiftCardBlock from "../GiftCardBlock";

describe("GiftCardBlock", () => {
  it("updates purchase link when selecting amount", () => {
    render(<GiftCardBlock amounts={[25, 50]} ctaHref="/buy" ctaLabel="Buy" />);
    const link = screen.getByRole("link", { name: "Buy" });
    expect(link).toHaveAttribute("href", "/buy?amount=25");
    fireEvent.click(screen.getByRole("button", { name: "$50" }));
    expect(link).toHaveAttribute("href", "/buy?amount=50");
  });
});
