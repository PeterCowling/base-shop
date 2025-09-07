import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../src/app/login/page";

jest.mock("@shared-utils", () => ({
  getCsrfToken: () => "TOKEN",
}));

describe("LoginPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("submits credentials and shows success message", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("User ID"), "alice");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "TOKEN",
        },
        body: JSON.stringify({ customerId: "alice", password: "secret", remember: false }),
      }),
    );
    expect(await screen.findByText("Logged in")).toBeInTheDocument();
  });

  it("includes remember flag when checked", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText("User ID"), "alice");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret");
    await userEvent.click(screen.getByLabelText(/remember/i));
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        body: JSON.stringify({ customerId: "alice", password: "secret", remember: true }),
      }),
    );
  });

  it("shows error message when login fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid" }),
    });

    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /login/i }));
    expect(await screen.findByText("Invalid")).toBeInTheDocument();
  });
});
