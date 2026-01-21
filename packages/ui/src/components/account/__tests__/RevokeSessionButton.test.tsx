import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RevokeSessionButton from "../RevokeSessionButton";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({ refresh }),
}));
// Minimal i18n mock so tests assert human-readable labels
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) =>
    ({
      "actions.revoke": "Revoke",
      "actions.revoking": "Revoking...",
      "account.sessions.errors.revokeFailed": "Failed to revoke session.",
    } as Record<string, string>)[key] ?? key,
}));

describe("RevokeSessionButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revokes session and toggles button state", async () => {
    let resolve: (value: { success: boolean }) => void;
    const revoke = jest
      .fn()
      .mockReturnValue(new Promise((r) => (resolve = r)));

    render(<RevokeSessionButton sessionId="123" revoke={revoke} />);

    const button = screen.getByRole("button", { name: "Revoke" });
    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveTextContent("Revoking...");

    resolve!({ success: true });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Revoke");
  });

  it("shows error message on failed revoke", async () => {
    let resolve: (value: { success: boolean; error: string }) => void;
    const revoke = jest
      .fn()
      .mockReturnValue(new Promise((r) => (resolve = r)));

    render(<RevokeSessionButton sessionId="123" revoke={revoke} />);

    const button = screen.getByRole("button", { name: "Revoke" });
    await userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveTextContent("Revoking...");

    resolve!({ success: false, error: "msg" });

    expect(await screen.findByText("msg")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Revoke");
  });
});
