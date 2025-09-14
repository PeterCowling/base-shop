import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import CampaignPage from "./page";

afterEach(() => {
  jest.clearAllMocks();
});

describe("CampaignPage", () => {
  it("shows Sent on success", async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({ ok: true });
    render(<CampaignPage />);
    await userEvent.type(screen.getByPlaceholderText("Recipient"), "a@b.com");
    await userEvent.type(screen.getByPlaceholderText("Subject"), "Hello");
    await userEvent.type(screen.getByPlaceholderText("HTML body"), "Body");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/campaigns",
      expect.objectContaining({ method: "POST" })
    );
    expect(await screen.findByText("Sent")).toBeInTheDocument();
  });

  it("shows Failed on error", async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({ ok: false });
    render(<CampaignPage />);
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });
});

