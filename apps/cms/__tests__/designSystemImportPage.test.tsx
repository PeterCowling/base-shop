import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const track = jest.fn();
const push = jest.fn();

jest.mock("@acme/telemetry", () => ({
  track,
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

import DesignSystemImportPage from "../src/app/cms/shop/[shop]/import/design-system/page";

describe("DesignSystemImportPage", () => {
  const useRouter = require("next/navigation").useRouter as jest.Mock;
  const useParams = require("next/navigation").useParams as jest.Mock;

  beforeEach(() => {
    track.mockClear();
    push.mockClear();
    useRouter.mockReturnValue({ push });
    useParams.mockReturnValue({ shop: "demo-shop" });
  });

  it("tracks page view once with shop context", async () => {
    render(<DesignSystemImportPage />);

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("designsystem:import:view", { shop: "demo-shop" });
    });
  });

  it("tracks navigation CTAs", async () => {
    render(<DesignSystemImportPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /begin guided import/i }));
    expect(track).toHaveBeenCalledWith("designsystem:import:start", { shop: "demo-shop" });
    expect(push).toHaveBeenCalledWith("/cms/shop/demo-shop/wizard");

    await user.click(screen.getByRole("button", { name: /explore theme library/i }));
    expect(track).toHaveBeenCalledWith("designsystem:import:navigate-library", { shop: "demo-shop" });
    expect(push).toHaveBeenCalledWith("/cms/shop/demo-shop/themes");

    await user.click(screen.getByRole("button", { name: /manage team access/i }));
    expect(track).toHaveBeenCalledWith("designsystem:import:navigate-settings", { shop: "demo-shop" });
    expect(push).toHaveBeenCalledWith("/cms/shop/demo-shop/settings");
  });

  it("tracks documentation link clicks", async () => {
    render(<DesignSystemImportPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: /package import guide/i }));
    expect(track).toHaveBeenCalledWith("designsystem:import:doc", {
      shop: "demo-shop",
      target: "package",
    });

    await user.click(screen.getByRole("link", { name: /theme library tips/i }));
    expect(track).toHaveBeenCalledWith("designsystem:import:doc", {
      shop: "demo-shop",
      target: "lifecycle",
    });
  });
});
