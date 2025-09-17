import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import CampaignPage from "./page";

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
    expect(await screen.findByText("Campaign sent.")).toBeInTheDocument();
  });

  it("shows error toast on failure", async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({ ok: false });
    render(<CampaignPage />);
    const recipient = await screen.findByLabelText(/Recipient/i);
    await userEvent.type(recipient, "a@b.com");
    await userEvent.type(screen.getByLabelText(/Subject/i), "Hello");
    await userEvent.type(screen.getByLabelText(/HTML body/i), "Body");
    await userEvent.click(screen.getByRole("button", { name: /send now/i }));
    expect(await screen.findByText("Unable to send campaign.")).toBeInTheDocument();
  });
});

