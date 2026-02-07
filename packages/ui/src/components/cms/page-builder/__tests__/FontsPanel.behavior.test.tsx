import React from "react";
import { act,fireEvent, render, screen } from "@testing-library/react";

import FontsPanel from "../FontsPanel";

// Mock shadcn dialog bits to simple wrappers
jest.mock("../../../atoms/shadcn", () => ({ __esModule: true, Dialog: ({ children }: any) => <div>{children}</div>, DialogContent: ({ children }: any) => <div role="dialog">{children}</div>, DialogTitle: ({ children }: any) => <div>{children}</div> }));
jest.mock("next/navigation", () => ({ __esModule: true, usePathname: () => "/cms/shop/acme" }));
jest.mock("@acme/lib/shop", () => ({ __esModule: true, getShopFromPath: () => "acme" }));

describe("FontsPanel", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
    localStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("loads theme tokens on open and schedules save when applying pairing", async () => {
    // Initial theme GET
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ themeDefaults: { "--font-sans": '"Inter"' }, themeTokens: { "--font-body": '"Inter"' } }) } as any);
    // Subsequent PATCH
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true } as any);

    render(<FontsPanel open onOpenChange={() => {}} />);
    // loaded into preview tokens
    await act(async () => {});
    expect(localStorage.getItem("cms-preview-tokens")).toContain("--font");

    // Tag filter All is present; click first "Use pairing" if present
    const useButtons = screen.getAllByRole("button", { name: "Use pairing" });
    if (useButtons.length) {
      fireEvent.click(useButtons[0]);
      // Debounce save
      act(() => { jest.advanceTimersByTime(600); });
      expect((global.fetch as jest.Mock).mock.calls.some(([url, init]) => String(url).includes("/cms/api/shops/acme/theme") && (init as any)?.method === "PATCH")).toBe(true);
    }
  });
});
