import { fireEvent, render, screen } from "@testing-library/react";
import StylePanel from "../StylePanel";

const translations: Record<string, string> = {};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

beforeEach(() => {
  Object.keys(translations).forEach((k) => delete translations[k]);
});

describe("StylePanel", () => {
  it("updates styles and warns on low contrast", () => {
    Object.assign(translations, {
      "cms.style.foreground": "Foreground",
      "cms.style.background": "Background",
      "cms.style.lowContrast": "Low contrast",
      "cms.style.colorPlaceholder": "Color placeholder",
    });
    const component: any = { type: "Button", styles: "" };
    const handleInput = jest.fn((field, value) => {
      component[field] = value;
    });
    const { rerender } = render(
      <StylePanel component={component} handleInput={handleInput} />
    );
    fireEvent.change(screen.getByLabelText("Foreground"), {
      target: { value: "#ffffff" }, // eslint-disable-line ds/no-raw-color -- TEST-123: test exercises literal user input
    });
    rerender(<StylePanel component={component} handleInput={handleInput} />);
    fireEvent.change(screen.getByLabelText("Background"), {
      target: { value: "#ffffff" }, // eslint-disable-line ds/no-raw-color -- TEST-123: test exercises literal user input
    });
    const last = handleInput.mock.calls.pop();
    expect(last[0]).toBe("styles");
    expect(JSON.parse(last[1])).toEqual({
      color: { fg: "#ffffff", bg: "#ffffff" }, // eslint-disable-line ds/no-raw-color -- TEST-123: test asserts literal values coming from inputs
      typography: {},
    });
    rerender(<StylePanel component={component} handleInput={handleInput} />);
    expect(screen.getByRole("status")).toHaveTextContent("Low contrast");
  });

  it("updates per-breakpoint typography overrides", () => {
    Object.assign(translations, {
      "cms.style.fontFamily": "Font family",
      "cms.style.fontSize": "Font size",
      "cms.style.lineHeight": "Line height",
    });

    const component: any = { type: "Text", styles: "" };
    const handleInput = jest.fn((field, value) => {
      component[field] = value;
    });
    const { rerender } = render(
      <StylePanel component={component} handleInput={handleInput} />
    );

    // Desktop overrides
    const fsDesktop = screen.getByLabelText("Font size (Desktop)") as HTMLInputElement;
    const lhDesktop = screen.getByLabelText("Line height (Desktop)") as HTMLInputElement;
    // Use Testing Library focus helper to auto-wrap in React act
    fireEvent.focus(fsDesktop);
    fsDesktop.setSelectionRange(0, 0);
    fireEvent.change(fsDesktop, { target: { value: "--fs-lg" } });
    fireEvent.change(lhDesktop, { target: { value: "--lh-6" } });
    rerender(<StylePanel component={component} handleInput={handleInput} />);

    // Tablet overrides
    const fsTablet = screen.getByLabelText("Font size (Tablet)") as HTMLInputElement;
    const lhTablet = screen.getByLabelText("Line height (Tablet)") as HTMLInputElement;
    fireEvent.change(fsTablet, { target: { value: "--fs-md" } });
    fireEvent.change(lhTablet, { target: { value: "--lh-5" } });
    rerender(<StylePanel component={component} handleInput={handleInput} />);

    // Mobile overrides
    const fsMobile = screen.getByLabelText("Font size (Mobile)") as HTMLInputElement;
    const lhMobile = screen.getByLabelText("Line height (Mobile)") as HTMLInputElement;
    fireEvent.change(fsMobile, { target: { value: "--fs-sm" } });
    fireEvent.change(lhMobile, { target: { value: "--lh-4" } });

    // Last call contains full style JSON
    const last = handleInput.mock.calls.pop();
    expect(last[0]).toBe("styles");
    const parsed = JSON.parse(last[1]);
    expect(parsed.typographyDesktop).toEqual({ fontSize: "--fs-lg", lineHeight: "--lh-6" });
    expect(parsed.typographyTablet).toEqual({ fontSize: "--fs-md", lineHeight: "--lh-5" });
    expect(parsed.typographyMobile).toEqual({ fontSize: "--fs-sm", lineHeight: "--lh-4" });
  });
});
