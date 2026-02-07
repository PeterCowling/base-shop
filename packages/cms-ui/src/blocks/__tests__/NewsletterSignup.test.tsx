import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("clears form and shows success message on successful submission", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    render(
      <NewsletterSignup
        action="/api/newsletter"
        placeholder="Your email"
        submitLabel="Join"
      />
    );
    const input = screen.getByPlaceholderText("Your email") as HTMLInputElement;
    await user.type(input, "test@example.com");
    await user.click(screen.getByRole("button", { name: "Join" }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/newsletter",
      expect.objectContaining({
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      })
    );
    expect(await screen.findByText(/success/i)).toBeInTheDocument();
    expect(input.value).toBe("");
  });

  it("shows error message on failed submission", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({ ok: false });
    global.fetch = fetchMock;
    render(
      <NewsletterSignup
        action="/api/newsletter"
        placeholder="Your email"
        submitLabel="Join"
      />
    );
    const input = screen.getByPlaceholderText("Your email");
    await user.type(input, "test@example.com");
    await user.click(screen.getByRole("button", { name: "Join" }));
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
