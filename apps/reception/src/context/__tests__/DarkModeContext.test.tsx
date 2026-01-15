import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const firebaseMocks = vi.hoisted(() => {
  const mockGet = vi.fn(() =>
    Promise.resolve({
      exists: () => false,
      val: () => null,
    })
  );
  const mockUpdate = vi.fn(() => Promise.resolve());
  const mockGetDatabase = vi.fn(() => ({}));
  const mockRef = vi.fn(() => ({}));
  return { mockGet, mockUpdate, mockGetDatabase, mockRef };
});

vi.mock("firebase/database", () => ({
  getDatabase: firebaseMocks.mockGetDatabase,
  ref: firebaseMocks.mockRef,
  get: firebaseMocks.mockGet,
  update: firebaseMocks.mockUpdate,
}));

const { mockGet, mockUpdate, mockGetDatabase, mockRef } = firebaseMocks;

import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";

import { DarkModeProvider, useDarkMode } from "../DarkModeContext";
import { AuthContext } from "../AuthContext";

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DarkModeProvider>{children}</DarkModeProvider>
);

const storage: Record<string, string> = {};
const mockStorage = {
  getItem: vi.fn((k: string) => (k in storage ? storage[k] : null)),
  setItem: vi.fn((k: string, v: string) => {
    storage[k] = v;
  }),
  removeItem: vi.fn((k: string) => {
    delete storage[k];
  }),
  clear: vi.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  }),
};

describe("useDarkMode", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    (global as Record<string, unknown>).localStorage = mockStorage;
    mockGet.mockClear();
    mockUpdate.mockClear();
    mockGetDatabase.mockClear();
    mockRef.mockClear();
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
      <AuthContext.Provider value={{ user, setUser: vi.fn() }}>
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
    mockGet.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ themeMode: "dark" }),
    });

    const authWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={{ user, setUser: vi.fn() }}>
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
    let resolveRemote: ((value: unknown) => void) | undefined;
    mockGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRemote = resolve;
        })
    );

    const authWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={{ user, setUser: vi.fn() }}>
        <DarkModeProvider>{children}</DarkModeProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useDarkMode(), { wrapper: authWrapper });

    act(() => {
      result.current.toggleDark();
    });

    expect(result.current.mode).toBe("dark");

    resolveRemote?.({
      exists: () => true,
      val: () => ({ themeMode: "light" }),
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
