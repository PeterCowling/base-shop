import { useTheme } from "../ThemeContext";

describe("ThemeContext: hook invoked directly throws", () => {
  it("throws when hook invoked directly", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => (useTheme as any)()).toThrow();
    spy.mockRestore();
  });
});
