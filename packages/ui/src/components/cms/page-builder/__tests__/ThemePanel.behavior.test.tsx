import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react";
import ThemePanel from "../ThemePanel";
// Mock Tokens to a simple passthrough stub to avoid heavy UI
jest.mock("../../style/Tokens", () => ({ __esModule: true, default: () => <div /> }));
// Note: We drive changes through the ColorThemeSelector mock below.

jest.useFakeTimers();

// Mock next/navigation and shop utils to return a shop
jest.mock("next/navigation", () => ({ __esModule: true, usePathname: () => "/cms/shop/acme" }));
jest.mock("@acme/shared-utils", () => ({ __esModule: true, getShopFromPath: () => "acme" }));

jest.mock("../ColorThemeSelector", () => ({ __esModule: true, default: ({ onChange }: any) => <button onClick={() => onChange({ "--color.brand": "#111111" })}>Change</button> }));

// Mock shadcn bits used by dialog variant
jest.mock("../../../atoms/shadcn", () => ({ __esModule: true, DialogContent: ({ children }: any) => <div>{children}</div>, DialogTitle: ({ children }: any) => <div>{children}</div> }));

describe("ThemePanel behavior", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
    localStorage.clear();
    // window.confirm default yes
    jest.spyOn(window, "confirm").mockReturnValue(true as any);
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.resetAllMocks();
  });

  it("loads tokens on mount and schedules PATCH on change", async () => {
    // Initial GET theme
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ themeDefaults: { "--color.brand": "#000000" }, themeTokens: { "--color.brand": "#000000" } }) } as any);
    // Subsequent PATCH calls succeed
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true } as any);

    render(<ThemePanel variant="dialog" />);
    // SavePreviewTokens side-effect persists tokens
    await act(async () => {});
    expect(localStorage.getItem("cms-preview-tokens")).toContain("--color.brand");

    // Change tokens → schedules save
    fireEvent.click(screen.getByText("Change"));
    // Flush debounce
    act(() => { jest.advanceTimersByTime(600); });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/cms/api/shops/acme/theme"), expect.objectContaining({ method: "PATCH" }));

    // 1 GET + 1 PATCH
    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) => (init as any)?.method === "PATCH");
    expect(patchCalls.length).toBeGreaterThanOrEqual(1);
  });
});
