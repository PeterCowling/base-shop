import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

import { ReceptionThemeProvider } from "../ReceptionThemeProvider";

// Mock the full ThemeProvider from @acme/ui so we don't need the full
// platform-core provider chain in a unit test.
const themeProviderMock = jest.fn(
  ({ children }: { children: React.ReactNode }) => <>{children}</>
);

jest.mock("@acme/ui/providers/ThemeProvider", () => ({
  ThemeProvider: (props: { children: React.ReactNode }) => themeProviderMock(props),
}));

describe("ReceptionThemeProvider", () => {
  beforeEach(() => {
    themeProviderMock.mockClear();
  });

  it("renders children without throwing", () => {
    const { getByText } = render(
      <ReceptionThemeProvider>
        <span>hello</span>
      </ReceptionThemeProvider>
    );
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("delegates theme state to the shared ThemeProvider without forcing a mode", () => {
    render(
      <ReceptionThemeProvider>
        <span>child</span>
      </ReceptionThemeProvider>
    );
    expect(themeProviderMock).toHaveBeenCalledTimes(1);
  });
});
