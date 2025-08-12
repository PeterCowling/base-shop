import { render, screen } from "@testing-library/react";
import NewsletterSignup from "../NewsletterSignup";

describe("NewsletterSignup", () => {
  it("renders provided placeholder, button text, and action", () => {
    render(
      <NewsletterSignup
        placeholder="Email here"
        buttonText="Join"
        action="/api/signup"
      />
    );
    const input = screen.getByPlaceholderText("Email here") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    const form = input.closest("form");
    expect(form).toHaveAttribute("action", "/api/signup");
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
  });
});
