import { fireEvent, render, screen } from "@testing-library/react";
import StylePanel from "../StylePanel";

const translations: Record<string, string> = {
  "cms.style.foreground": "Foreground",
  "cms.style.background": "Background",
  "cms.style.border": "Border",
  "cms.style.fontFamily": "Font family",
  "cms.style.fontSize": "Font size",
  "cms.style.fontWeight": "Font weight",
  "cms.style.lineHeight": "Line height",
  "cms.style.lowContrast": "Low contrast",
};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

describe("StylePanel", () => {
  it("emits token values", () => {
    const onChange = jest.fn();
    render(<StylePanel value={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Foreground"), {
      target: { value: "token.color.fg" },
    });
    expect(onChange).toHaveBeenCalledWith({ color: "token.color.fg" });
  });

  it("shows contrast warning", () => {
    const onChange = jest.fn();
    render(
      <StylePanel
        value={{ color: "#000000", backgroundColor: "#000000" }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Low contrast");
  });
});
