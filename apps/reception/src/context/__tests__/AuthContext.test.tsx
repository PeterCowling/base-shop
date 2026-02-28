import "@testing-library/jest-dom";

import React from "react";
import { act, renderHook } from "@testing-library/react";

import { AuthProvider, useAuth } from "../AuthContext";

// Firebase service mocks required by AuthProvider internals
jest.mock("../../services/useFirebase", () => ({
  useFirebaseApp: () => ({ projectId: "test" }),
  useFirebaseDatabase: () => ({}),
}));

const subscribeUnsubscribeMock = jest.fn();
const loginWithEmailPasswordMock = jest.fn();
const logoutMock = jest.fn();

jest.mock("../../services/firebaseAuth", () => ({
  getFirebaseAuth: () => ({}),
  loginWithEmailPassword: (...args: unknown[]) =>
    loginWithEmailPasswordMock(...args),
  logout: () => logoutMock(),
  subscribeToAuthState: (
    _auth: unknown,
    _db: unknown,
    _cb: (u: unknown) => void,
  ) => subscribeUnsubscribeMock(),
}));

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscribeUnsubscribeMock.mockReturnValue(() => {});
    logoutMock.mockResolvedValue(undefined);
  });

  it("throws when used outside AuthProvider", () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      expect(() => renderHook(() => useAuth())).toThrow(
        "useAuth must be used inside an AuthProvider",
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("returns null user and loading status on initial render", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe("loading");
  });

  it("transitions to unauthenticated and clears user after logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe("unauthenticated");
  });
});
