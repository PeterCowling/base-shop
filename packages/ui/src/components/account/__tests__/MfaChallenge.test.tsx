import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MfaChallenge from "../MfaChallenge";

jest.mock("@acme/shared-utils", () => ({
  __esModule: true,
  getCsrfToken: jest.fn(() => "csrf-token"),
}));

describe("MfaChallenge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("successful verification clears error and invokes onSuccess", async () => {
    const onSuccess = jest.fn();
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ verified: false }) })
      .mockResolvedValueOnce({ json: async () => ({ verified: true }) });

    render(<MfaChallenge onSuccess={onSuccess} />);

    const input = screen.getByPlaceholderText("Enter MFA code");
    await userEvent.type(input, "111111");

    const button = screen.getByRole("button", { name: /verify/i });
    await userEvent.click(button);
    expect(await screen.findByText("Invalid code")).toBeInTheDocument();

    await userEvent.click(button);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(screen.queryByText("Invalid code")).not.toBeInTheDocument();
  });

  it("failed verification displays \"Invalid code\"", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ verified: false }) });

    render(<MfaChallenge />);

    const input = screen.getByPlaceholderText("Enter MFA code");
    await userEvent.type(input, "222222");
    await userEvent.click(screen.getByRole("button", { name: /verify/i }));

    expect(await screen.findByText("Invalid code")).toBeInTheDocument();
  });

  it("token input value updates with onChange", async () => {
    render(<MfaChallenge />);
    const input = screen.getByPlaceholderText("Enter MFA code");
    await userEvent.type(input, "123456");
    expect(input).toHaveValue("123456");
  });
});
