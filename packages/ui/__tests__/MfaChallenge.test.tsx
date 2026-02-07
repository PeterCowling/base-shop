import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import MfaChallenge from "../src/components/account/MfaChallenge";

expect.extend(toHaveNoViolations);

jest.mock("@acme/lib/security", () => ({
  __esModule: true,
  getCsrfToken: () => "csrf-token",
}));

describe("MfaChallenge", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("accepts valid codes and calls onSuccess", async () => {
    const onSuccess = jest.fn();
    // mock fetch to return verified true
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ verified: true }),
    }) as any;

    render(<MfaChallenge onSuccess={onSuccess} />);
    await userEvent.type(
      screen.getByPlaceholderText("Enter MFA code"),
      "123456"
    );
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(screen.queryByText(/invalid code/i)).not.toBeInTheDocument();
  });

  it("shows an error for invalid codes", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ verified: false }),
    }) as any;

    render(<MfaChallenge />);
    await userEvent.type(
      screen.getByPlaceholderText("Enter MFA code"),
      "000000"
    );
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText(/invalid code/i)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ verified: false }),
    }) as any;

    const { container } = render(<MfaChallenge />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
