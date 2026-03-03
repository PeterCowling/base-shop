import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

import { ReceptionThemeProvider } from "../ReceptionThemeProvider";

// Mock the full ThemeProvider from @acme/ui so we don't need the full
// platform-core provider chain in a unit test.
jest.mock("@acme/ui/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock useTheme so we can verify DarkModeBridge calls setMode("dark").
const mockSetMode = jest.fn();
jest.mock("@acme/ui/hooks/useTheme", () => ({
  useTheme: () => ({ setMode: mockSetMode }),
}));

describe("ReceptionThemeProvider", () => {
  beforeEach(() => {
    mockSetMode.mockClear();
  });

  it("renders children without throwing", () => {
    const { getByText } = render(
      <ReceptionThemeProvider>
        <span>hello</span>
      </ReceptionThemeProvider>
    );
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("calls setMode with dark on mount", () => {
    render(
      <ReceptionThemeProvider>
        <span>child</span>
      </ReceptionThemeProvider>
    );
    expect(mockSetMode).toHaveBeenCalledWith("dark");
  });
});
