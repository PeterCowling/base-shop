import { render, screen, fireEvent } from "@testing-library/react";
import PasswordResetRequestPage from "./page";

const originalFetch = global.fetch;

describe("PasswordResetRequestPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it("shows success message on successful request", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response) as unknown as typeof global.fetch;

    render(<PasswordResetRequestPage />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByText("Check your email for a reset link")
    ).toBeInTheDocument();
  });

  it("shows error message on failed request", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        json: async () => ({ error: "No account found" }),
      } as Response) as unknown as typeof global.fetch;

    render(<PasswordResetRequestPage />);

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("No account found")).toBeInTheDocument();
  });
});
