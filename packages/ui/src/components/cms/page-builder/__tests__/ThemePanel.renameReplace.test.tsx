import React from "react";
import { act,fireEvent, render } from "@testing-library/react";

import ThemePanel from "../ThemePanel";

jest.useFakeTimers();

jest.mock("next/navigation", () => ({ __esModule: true, usePathname: () => "/cms/shop/acme" }));
jest.mock("@acme/lib/shop", () => ({ __esModule: true, getShopFromPath: () => "acme" }));

// Mock Tokens to expose rename/replace hooks via buttons
jest.mock("../../style/Tokens", () => ({
  __esModule: true,
  default: ({ onRenameToken, onReplaceColor }: any) => (
    <div>
      <button onClick={() => onRenameToken("--color.brand", "--color.primary")}>Rename token</button>
      { }
      <button onClick={() => onReplaceColor("--color.brand", "#333333")}>Replace color</button>
    </div>
  ),
}));
jest.mock("../ColorThemeSelector", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../../../atoms/shadcn", () => ({ __esModule: true, DialogContent: ({ children }: any) => <div>{children}</div>, DialogTitle: ({ children }: any) => <div>{children}</div> }));

describe("ThemePanel rename/replace tokens", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
    localStorage.clear();
    // user confirms rename conflicts
    jest.spyOn(window, "confirm").mockReturnValue(true as any);
  });
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  it("debounces saves after rename and replace", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({
      themeDefaults: { "--color.brand": "#000000", "--color.primary": "#111111" },  
      themeTokens: { "--color.brand": "#000000" },  
    }) } as any);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true } as any);

    render(<ThemePanel variant="dialog" />);
    await act(async () => {});

    fireEvent.click(document.querySelector("button")!); // Rename token
    act(() => { jest.advanceTimersByTime(600); });
    fireEvent.click(document.querySelectorAll("button")[1]); // Replace color
    act(() => { jest.advanceTimersByTime(600); });

    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) => (init as any)?.method === "PATCH");
    expect(patchCalls.length).toBeGreaterThanOrEqual(1);
  });
});
