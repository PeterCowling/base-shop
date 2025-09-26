import React from "react";
import { render, act, fireEvent } from "@testing-library/react";
import ThemePanel from "../ThemePanel";

jest.useFakeTimers();

jest.mock("next/navigation", () => ({ __esModule: true, usePathname: () => "/cms/shop/acme" }));
jest.mock("@acme/shared-utils", () => ({ __esModule: true, getShopFromPath: () => "acme" }));
jest.mock("../../style/Tokens", () => ({ __esModule: true, default: ({ onRenameToken }: any) => <button onClick={() => onRenameToken("--color.brand", "--color.primary")}>Rename token</button> }));
jest.mock("../ColorThemeSelector", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../../../atoms/shadcn", () => ({ __esModule: true, DialogContent: ({ children }: any) => <div>{children}</div>, DialogTitle: ({ children }: any) => <div>{children}</div> }));

describe("ThemePanel rename conflict cancel", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
    localStorage.clear();
    jest.spyOn(window, "confirm").mockReturnValue(false as any);
  });
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  it("does not schedule save when user cancels rename conflict", async () => {
    // Both defaults and tokens contain conflicting keys so confirm(false) path is exercised
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({
      themeDefaults: { "--color.brand": "#000", "--color.primary": "#111" },
      themeTokens: { "--color.brand": "#000" },
    }) } as any);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true } as any);

    render(<ThemePanel variant="dialog" />);
    await act(async () => {});
    fireEvent.click(document.querySelector("button")!);
    act(() => { jest.advanceTimersByTime(600); });
    const patchCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) => (init as any)?.method === "PATCH");
    expect(patchCalls.length).toBe(0);
  });
});

