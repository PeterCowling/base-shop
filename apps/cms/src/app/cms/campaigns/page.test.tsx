import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CampaignPage from "./page";

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  update: jest.fn(),
  promise: async <T,>(value: Promise<T>) => value,
};

jest.mock("@acme/ui/operations", () => ({
  __esModule: true,
  useToast: () => mockToast,
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe("CampaignPage", () => {
  it("shows toast on success", async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({ ok: true });
    render(<CampaignPage />);
    const recipient = await screen.findByLabelText(/Recipient/i);
    await userEvent.type(recipient, "a@b.com");
    await userEvent.type(screen.getByLabelText(/Subject/i), "Hello");
    await userEvent.type(screen.getByLabelText(/HTML body/i), "Body");
    await userEvent.click(screen.getByRole("button", { name: /send now/i }));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/campaigns",
      expect.objectContaining({ method: "POST" })
    );
    expect(mockToast.success).toHaveBeenCalledWith("Campaign sent.");
  });

  it("shows error toast on failure", async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({ ok: false });
    render(<CampaignPage />);
    const recipient = await screen.findByLabelText(/Recipient/i);
    await userEvent.type(recipient, "a@b.com");
    await userEvent.type(screen.getByLabelText(/Subject/i), "Hello");
    await userEvent.type(screen.getByLabelText(/HTML body/i), "Body");
    await userEvent.click(screen.getByRole("button", { name: /send now/i }));
    expect(mockToast.error).toHaveBeenCalledWith("Unable to send campaign.");
  });
});
