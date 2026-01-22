import "@testing-library/jest-dom";

import React from "react";
import { act, renderHook } from "@testing-library/react";

import { AuthProvider, useAuth } from "../AuthContext";

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

interface TestUser {
  email: string;
  user_name: string;
}

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(() => renderHook(() => useAuth())).toThrow(
        "useAuth must be used inside an AuthProvider"
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("returns updated user when setUser is called", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const user: TestUser = { email: "test@example.com", user_name: "Test" };

    act(() => {
      result.current.setUser(user);
    });

    expect(result.current.user).toEqual(user);
  });
});
