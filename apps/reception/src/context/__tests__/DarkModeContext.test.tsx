import "@testing-library/jest-dom";

import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import { AuthContext } from "../AuthContext";
import { DarkModeProvider, useDarkMode } from "../DarkModeContext";

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  get: jest.fn(() =>
    Promise.resolve({
      exists: () => false,
      val: () => null,
    })
  ),
  update: jest.fn(() => Promise.resolve()),
}));

const {
  get: mockGet,
  update: mockUpdate,
  getDatabase: mockGetDatabase,
  ref: mockRef,
} = jest.requireMock("firebase/database") as {
  get: jest.Mock;
  update: jest.Mock;
  getDatabase: jest.Mock;
  ref: jest.Mock;
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DarkModeProvider>{children}</DarkModeProvider>
);

const storage: Record<string, string> = {};
const mockStorage = {
  getItem: jest.fn((k: string) => (k in storage ? storage[k] : null)),
  setItem: jest.fn((k: string, v: string) => {
    storage[k] = v;
  }),
  removeItem: jest.fn((k: string) => {
    delete storage[k];
  }),
  clear: jest.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  }),
};

describe("useDarkMode", () => {
  let consoleErrorSpy: jest.SpyInstance | undefined;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: mockStorage,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: mockStorage,
    });
    mockGet.mockReset();
    mockUpdate.mockReset();
    mockGetDatabase.mockReset();
    mockRef.mockReset();

    mockGet.mockImplementation(() =>
      Promise.resolve({
        exists: () => false,
        val: () => null,
      })
    );
    mockUpdate.mockImplementation(() => Promise.resolve());
    mockGetDatabase.mockImplementation(() => ({}));
    mockRef.mockImplementation(() => ({}));
  });
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useDarkMode())).toThrow(
      "useDarkMode must be used within a DarkModeProvider"
    );
  });

  it("toggles dark state and class", () => {
    const { result } = renderHook(() => useDarkMode(), { wrapper });

    expect(result.current.dark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.body.classList.contains("dark")).toBe(false);

    act(() => {
      result.current.toggleDark();
    });

    expect(result.current.dark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.body.classList.contains("dark")).toBe(true);
    expect(storage.darkMode).toBe(JSON.stringify("dark"));
  });

  it("loads initial state from storage", () => {
    storage.darkMode = JSON.stringify("dark");
    const { result } = renderHook(() => useDarkMode(), { wrapper });
    expect(result.current.dark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.body.classList.contains("dark")).toBe(true);
  });

  it("uses user-specific preference when authenticated", async () => {
    const user = { email: "test@example.com", user_name: "tester" };
    storage["darkMode:user:tester"] = JSON.stringify("dark");
    const authWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={{ user, setUser: jest.fn() }}>
        <DarkModeProvider>{children}</DarkModeProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useDarkMode(), { wrapper: authWrapper });

    expect(result.current.dark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(storage["darkMode:user:tester"]).toBe(JSON.stringify("dark"));
    expect(mockGetDatabase).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
        darkMode: true,
        themeMode: "dark",
      });
    });
  });

  it("hydrates user preference from firebase when no local value", async () => {
    const user = { email: "remote@example.com", user_name: "Remote" };
    mockGet.mockImplementation(() =>
      Promise.resolve({
        exists: () => true,
        val: () => ({ themeMode: "dark" }),
      })
    );

    const authWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={{ user, setUser: jest.fn() }}>
        <DarkModeProvider>{children}</DarkModeProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useDarkMode(), { wrapper: authWrapper });

    await waitFor(() => {
      expect(result.current.dark).toBe(true);
    });

    expect(storage["darkMode:user:Remote"]).toBe(JSON.stringify("dark"));
    expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
      darkMode: true,
      themeMode: "dark",
    });
  });

  it("does not override a manual selection made before remote preference resolves", async () => {
    const user = { email: "slow@example.com", user_name: "Slowpoke" };
    const resolveRemote: Array<(value: unknown) => void> = [];
    mockGet.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRemote.push(resolve);
        })
    );

    const authWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={{ user, setUser: jest.fn() }}>
        <DarkModeProvider>{children}</DarkModeProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useDarkMode(), { wrapper: authWrapper });

    act(() => {
      result.current.toggleDark();
    });

    expect(result.current.mode).toBe("dark");

    await act(async () => {
      resolveRemote.forEach((resolve) =>
        resolve({
          exists: () => true,
          val: () => ({ themeMode: "light" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
        darkMode: true,
        themeMode: "dark",
      });
    });

    expect(result.current.mode).toBe("dark");
    expect(storage["darkMode:user:Slowpoke"]).toBe(JSON.stringify("dark"));
  });
});
