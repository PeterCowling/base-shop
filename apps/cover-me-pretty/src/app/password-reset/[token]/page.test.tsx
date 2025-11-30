import { render, screen, fireEvent } from "@testing-library/react";
import PasswordResetPage from "./page";
import { useParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const originalFetch = global.fetch;

describe("PasswordResetPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it("shows success message when password reset succeeds", async () => {
    mockUseParams.mockReturnValue({ token: "abc" } as ReturnType<typeof useParams>);
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response) as unknown as typeof global.fetch;

    render(<PasswordResetPage />);

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Password updated")).toBeInTheDocument();
  });

  it("shows error message when password reset fails", async () => {
    mockUseParams.mockReturnValue({ token: "abc" } as ReturnType<typeof useParams>);
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Bad token" }),
      } as Response) as unknown as typeof global.fetch;

    render(<PasswordResetPage />);

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "pw" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Bad token")).toBeInTheDocument();
  });
});
