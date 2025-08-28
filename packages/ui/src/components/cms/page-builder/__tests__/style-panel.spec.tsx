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
      target: { value: "#ffffff" },
    });
    rerender(<StylePanel component={component} handleInput={handleInput} />);
    fireEvent.change(screen.getByLabelText("Background"), {
      target: { value: "#ffffff" },
    });
    const last = handleInput.mock.calls.pop();
    expect(last[0]).toBe("styles");
    expect(JSON.parse(last[1])).toEqual({
      color: { fg: "#ffffff", bg: "#ffffff" },
      typography: {},
    });
    rerender(<StylePanel component={component} handleInput={handleInput} />);
    expect(screen.getByRole("status")).toHaveTextContent("Low contrast");
  });
});
