import "@testing-library/jest-dom";

import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import { AuthContext } from "@/context/AuthContext";

import {
  ReceptionThemeProvider,
  useReceptionTheme,
} from "../ReceptionThemeProvider";

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

const firebaseDatabase = jest.requireMock("firebase/database") as {
  getDatabase: jest.Mock;
  ref: jest.Mock;
  get: jest.Mock;
  update: jest.Mock;
};

const mockGet = firebaseDatabase.get;
const mockUpdate = firebaseDatabase.update;
const mockGetDatabase = firebaseDatabase.getDatabase;
const mockRef = firebaseDatabase.ref;

const createAuthValue = (
  user: { email: string; user_name: string } | null = null
) => ({
  user,
  status: user ? ("authenticated" as const) : ("unauthenticated" as const),
  login: jest.fn(),
  logout: jest.fn(),
  reauthenticate: jest.fn(),
  hasRole: jest.fn(() => false),
  hasAnyRole: jest.fn(() => false),
  isPrivileged: false,
});

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={createAuthValue()}>
    <ReceptionThemeProvider>{children}</ReceptionThemeProvider>
  </AuthContext.Provider>
);

describe("useReceptionTheme", () => {
  let consoleErrorSpy: jest.SpyInstance | undefined;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
    mockGet.mockClear();
    mockUpdate.mockClear();
    mockGetDatabase.mockClear();
    mockRef.mockClear();
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useReceptionTheme())).toThrow(
      "useReceptionTheme must be used within a ReceptionThemeProvider"
    );
  });

  it("toggles dark state and mirrors classes to html/body", async () => {
    const { result } = renderHook(() => useReceptionTheme(), { wrapper });

    expect(result.current.dark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.body.classList.contains("dark")).toBe(false);

    act(() => {
      result.current.toggleDark();
    });

    await waitFor(() => {
      expect(result.current.dark).toBe(true);
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.body.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("darkMode")).toBe(JSON.stringify("dark"));
  });

  it("loads initial state from legacy global storage", async () => {
    window.localStorage.setItem("darkMode", JSON.stringify("dark"));

    const { result } = renderHook(() => useReceptionTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.dark).toBe(true);
    });
  });

  it("uses user-specific preference when authenticated", async () => {
    const user = { email: "test@example.com", user_name: "tester" };
    window.localStorage.setItem(
      "darkMode:user:tester",
      JSON.stringify("dark")
    );

    const authWrapper: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => (
      <AuthContext.Provider value={createAuthValue(user)}>
        <ReceptionThemeProvider>{children}</ReceptionThemeProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useReceptionTheme(), {
      wrapper: authWrapper,
    });

    await waitFor(() => {
      expect(result.current.dark).toBe(true);
    });
    expect(window.localStorage.getItem("darkMode:user:tester")).toBe(
      JSON.stringify("dark")
    );
    expect(mockGetDatabase).toHaveBeenCalled();
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

    const authWrapper: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => (
      <AuthContext.Provider value={createAuthValue(user)}>
        <ReceptionThemeProvider>{children}</ReceptionThemeProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useReceptionTheme(), {
      wrapper: authWrapper,
    });

    await waitFor(() => {
      expect(result.current.dark).toBe(true);
    });

    expect(window.localStorage.getItem("darkMode:user:Remote")).toBe(
      JSON.stringify("dark")
    );
    expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
      darkMode: true,
      themeMode: "dark",
    });
  });

  it("does not override manual selection before remote resolves", async () => {
    const user = { email: "slow@example.com", user_name: "Slowpoke" };
    let resolveRemote: ((value: unknown) => void) | undefined;
    mockGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRemote = resolve;
        })
    );

    const authWrapper: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => (
      <AuthContext.Provider value={createAuthValue(user)}>
        <ReceptionThemeProvider>{children}</ReceptionThemeProvider>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useReceptionTheme(), {
      wrapper: authWrapper,
    });

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
    expect(window.localStorage.getItem("darkMode:user:Slowpoke")).toBe(
      JSON.stringify("dark")
    );
  });

  it("syncs legacy global mode from storage events", async () => {
    const { result } = renderHook(() => useReceptionTheme(), { wrapper });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "darkMode",
          newValue: JSON.stringify("dark"),
        })
      );
    });

    await waitFor(() => {
      expect(result.current.dark).toBe(true);
    });
  });
});
