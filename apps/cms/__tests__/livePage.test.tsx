import React from "react";
import { render, screen } from "@testing-library/react";
import LivePage from "../src/app/cms/live/page";

// Mock listShops to provide a set of shops
jest.mock("../src/lib/listShops", () => ({
  listShops: jest.fn().mockResolvedValue([
    "shop-alpha",
    "shop-beta",
    "shop-gamma",
  ]),
}));

// Helper to access paths consistently
const path = require("path");

// Mock fs (synchronous) for existsSync checks
jest.mock("fs", () => {
  return {
    existsSync: jest.fn((p: string) => {
      // allow resolveAppsRoot to find the real apps directory
      if (p.endsWith(`${path.sep}apps`)) return true;
      if (p.includes(`shop-alpha`)) return true; // app and package.json exist
      if (p.includes(`shop-beta${path.sep}package.json`)) return false; // missing package.json
      if (p.includes(`shop-beta`)) return true; // app directory exists
      if (p.includes(`shop-gamma`)) return true; // app and package.json exist
      return false;
    }),
  };
});

// Mock fs/promises for reading package.json files
jest.mock("fs/promises", () => ({
  readFile: jest.fn((p: string) => {
    if (p.includes("shop-alpha")) {
      return Promise.resolve(
        JSON.stringify({ scripts: { dev: "next dev -p 3001" } }),
      );
    }
    if (p.includes("shop-gamma")) {
      return Promise.reject(new Error("bad package"));
    }
    return Promise.reject(new Error(`unexpected path: ${p}`));
  }),
}));

describe("LivePage", () => {
  it("renders shop links and errors for missing ports", async () => {
    render(await LivePage());

    const alpha = await screen.findByRole("link", { name: "shop-alpha" });
    expect(alpha).toHaveAttribute("href", "http://localhost:3001");

    const beta = await screen.findByRole("link", { name: "shop-beta" });
    expect(beta).toHaveAttribute("href", "#");
    expect(
      await screen.findByText(
        "Failed to determine port: package.json not found",
      ),
    ).toBeInTheDocument();

    const gamma = await screen.findByRole("link", { name: "shop-gamma" });
    expect(gamma).toHaveAttribute("href", "#");
    expect(
      await screen.findByText("Failed to determine port: bad package"),
    ).toBeInTheDocument();
  });
});

