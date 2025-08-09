import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

function Buttons() {
  const { setTheme } = useTheme();
  return (
    <div>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("brandx")}>brandx</button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.className = "";
  });

  it("applies classes to <html> element and persists", () => {
    const { getByText } = render(
      <ThemeProvider>
        <Buttons />
      </ThemeProvider>
    );

    const html = document.documentElement;
    expect(html.className).toBe("");
    fireEvent.click(getByText("dark"));
    expect(html.classList.contains("theme-dark")).toBe(true);
    expect(localStorage.getItem("PREFERRED_THEME")).toBe("dark");
    fireEvent.click(getByText("brandx"));
    expect(html.classList.contains("theme-dark")).toBe(false);
    expect(html.classList.contains("theme-brandx")).toBe(true);
    expect(localStorage.getItem("PREFERRED_THEME")).toBe("brandx");
  });

  it("matches snapshot on initial render", () => {
    const { asFragment } = render(
      <ThemeProvider>
        <div>Hello</div>
      </ThemeProvider>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
