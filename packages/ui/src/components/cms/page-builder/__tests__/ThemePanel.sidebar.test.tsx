import React from "react";
import { render, act, fireEvent } from "@testing-library/react";
import ThemePanel from "../ThemePanel";

jest.useFakeTimers();

jest.mock("next/navigation", () => ({ __esModule: true, usePathname: () => "/cms/shop/acme" }));
jest.mock("@acme/shared-utils", () => ({ __esModule: true, getShopFromPath: () => "acme" }));
// eslint-disable-next-line ds/no-raw-color -- TEST-123: test-only mock uses literal hex to simulate theme color
jest.mock("../ColorThemeSelector", () => ({ __esModule: true, default: ({ onChange }: any) => <button onClick={() => onChange({ "--color.brand": "#123456" })}>Apply Theme</button> }));
jest.mock("../../style/Tokens", () => ({ __esModule: true, default: () => <div /> }));

describe("ThemePanel sidebar variant", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllTimers();
  });

  it("renders sidebar and schedules save via ColorThemeSelector", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ themeDefaults: {}, themeTokens: {} }) } as any);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true } as any);
    render(<ThemePanel variant="sidebar" />);
    await act(async () => {});
    fireEvent.click(document.querySelector("button")!);
    act(() => { jest.advanceTimersByTime(600); });
    expect((global.fetch as jest.Mock).mock.calls.some(([url, init]) => String(url).includes("/cms/api/shops/acme/theme") && (init as any)?.method === "PATCH")).toBe(true);
  });
});
