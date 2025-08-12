import { render, screen } from "@testing-library/react";
import NewsletterSignup from "../NewsletterSignup";

describe("NewsletterSignup", () => {
  it("renders text and form", () => {
    render(
      <NewsletterSignup
        text="Stay updated"
        action="/api/newsletter"
        placeholder="Your email"
        submitLabel="Join"
      />
    );
    expect(screen.getByText("Stay updated")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
  });
});
