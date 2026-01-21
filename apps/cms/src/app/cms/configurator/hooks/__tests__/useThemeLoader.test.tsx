import { act, renderHook, waitFor } from "@testing-library/react";

import {
  baseTokens as mockBaseTokens,
  loadThemeTokens as mockLoadThemeTokens,
} from "../../../wizard/tokenUtils";
import { useThemeLoader } from "../useThemeLoader";

jest.mock("../../../wizard/tokenUtils", () => ({
  baseTokens: { color: "base" },
  loadThemeTokens: jest.fn(),
}));

let state: any;
const setState = jest.fn((updater: any) => {
  state = typeof updater === "function" ? updater(state) : updater;
});

jest.mock("../../ConfiguratorContext", () => ({
  useConfigurator: () => ({ state, setState }),
}));

beforeEach(() => {
  state = { theme: "light", themeDefaults: {}, themeOverrides: {} };
  jest.clearAllMocks();
});

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useThemeLoader", () => {
  it("populates themeDefaults with baseTokens on first render", async () => {
    const def = deferred<Record<string, string>>();
    (mockLoadThemeTokens as jest.Mock).mockReturnValue(def.promise);

    renderHook(() => useThemeLoader());

    await waitFor(() =>
      expect(state.themeDefaults).toEqual(mockBaseTokens)
    );

    def.resolve({});
  });

  it("loads theme tokens when theme changes and merges overrides", async () => {
    const lightTokens = { color: "light", padding: "1" };
    const darkTokens = { color: "dark", background: "black" };
    state.themeOverrides = { color: "override" };

    (mockLoadThemeTokens as jest.Mock)
      .mockResolvedValueOnce(lightTokens)
      .mockResolvedValueOnce(darkTokens);

    const { result, rerender } = renderHook(() => useThemeLoader());

    await waitFor(() => expect(state.themeDefaults).toEqual(lightTokens));
    rerender();
    expect(result.current).toEqual({ ...lightTokens, color: "override" });

    act(() => {
      state.theme = "dark";
    });
    rerender();

    await waitFor(() =>
      expect(mockLoadThemeTokens).toHaveBeenLastCalledWith("dark")
    );
    await waitFor(() => expect(state.themeDefaults).toEqual(darkTokens));
    rerender();

    expect(result.current).toEqual({ ...darkTokens, color: "override" });
  });
});
