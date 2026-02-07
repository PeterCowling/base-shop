import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import { useTheme } from "@/hooks/useTheme";
import { ThemeContext } from "@/providers/ThemeProvider";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={{ theme: "light", isDark: false, setTheme: () => {} }}>
    {children}
  </ThemeContext.Provider>
);

describe("useTheme", () => {
  it("returns the theme context value", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    expect(result.current.isDark).toBe(false);
  });

  it("throws when used outside ThemeProvider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used inside <ThemeProvider>",
    );
  });
});