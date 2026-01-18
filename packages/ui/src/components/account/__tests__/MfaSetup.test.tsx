import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../../../../test/resetNextMocks";

jest.mock("@acme/shared-utils", () => ({
  __esModule: true,
  getCsrfToken: jest.fn(() => "csrf-token"),
}));

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { toDataURL: jest.fn() },
}));

import QRCode from "qrcode";

// Minimal i18n shim so visible text matches test expectations
const translations: Record<string, string> = {
  "account.mfa.generateSecret": "Generate Secret",
  "account.mfa.qr.alt": "MFA QR Code",
  "account.mfa.secret.label": "Secret:",
  "account.mfa.input.placeholderShort": "Enter code",
  "actions.verify": "Verify",
  "account.mfa.enabled": "MFA enabled",
  "account.mfa.error.invalid": "Invalid code",
};
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

import MfaSetup from "../MfaSetup";

const toDataURL = (QRCode as any).toDataURL as jest.Mock;


describe("MfaSetup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    toDataURL.mockResolvedValue("data-url");
  });

  it("enroll displays secret and QR code", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ secret: "abc123", otpauth: "otpauth://test" }),
    });

    render(<MfaSetup />);
    await userEvent.click(
      screen.getByRole("button", { name: /generate secret/i })
    );

    expect(await screen.findByText("Secret: abc123")).toBeInTheDocument();
    await waitFor(() => expect(toDataURL).toHaveBeenCalledWith("otpauth://test"));
    expect(screen.getByAltText("MFA QR Code")).toHaveAttribute("src", "data-url");
  });

  it("shows status messages for verification", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secret: "abc123", otpauth: "otpauth://test" }),
      })
      .mockResolvedValueOnce({ json: async () => ({ verified: false }) })
      .mockResolvedValueOnce({ json: async () => ({ verified: true }) });

    render(<MfaSetup />);
    await userEvent.click(
      screen.getByRole("button", { name: /generate secret/i })
    );
    await screen.findByText("Secret: abc123");

    const input = screen.getByPlaceholderText(/enter code/i);
    await userEvent.type(input, "123456");

    const button = screen.getByRole("button", { name: /verify/i });
    await userEvent.click(button);
    expect(await screen.findByText("Invalid code")).toBeInTheDocument();

    await userEvent.click(button);
    expect(await screen.findByText("MFA enabled")).toBeInTheDocument();
  });

  it("skips QR code when otpauth is null", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ secret: "abc123", otpauth: null }),
    });

    render(<MfaSetup />);
    await userEvent.click(
      screen.getByRole("button", { name: /generate secret/i })
    );

    expect(await screen.findByText("Secret: abc123")).toBeInTheDocument();
    expect(screen.queryByAltText("MFA QR Code")).not.toBeInTheDocument();
    expect(toDataURL).not.toHaveBeenCalled();
  });
});
