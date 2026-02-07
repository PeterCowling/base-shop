import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import LivePage from "../src/app/cms/live/page";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, asChild, ...props }: any) =>
      asChild && React.isValidElement(children)
        ? React.cloneElement(children, props)
        : React.createElement("button", props, children),
    Card: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    CardContent: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    Progress: ({ label }: any) =>
      React.createElement("div", { role: label ? "progressbar" : undefined }, label ?? null),
    Tag: ({ children, ...props }: any) =>
      React.createElement("span", props, children),
  };
});

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
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    render(await LivePage());

    const openButton = await screen.findByRole("button", {
      name: /open preview/i,
    });
    fireEvent.click(openButton);
    expect(openSpy).toHaveBeenCalledWith(
      "http://localhost:3001",
      "_blank",
      "noopener,noreferrer",
    );

    const detailButtons = await screen.findAllByRole("button", {
      name: /view details/i,
    });
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText("package.json not found")).toBeInTheDocument();

    openSpy.mockRestore();
  });
});

