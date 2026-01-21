import { fireEvent, render, screen } from "@testing-library/react";

import { track } from "@acme/telemetry";

import useContrastWarnings from "../../../../hooks/useContrastWarnings";
import StylePanel from "../StylePanel";

const translations: Record<string, string> = {};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] || key,
}));

jest.mock("../../../../hooks/useContrastWarnings");

jest.mock("@acme/telemetry", () => ({
  track: jest.fn(),
}));

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  Object.keys(translations).forEach((k) => delete translations[k]);
  (useContrastWarnings as jest.Mock).mockReturnValue({ contrast: 2, suggestion: null });
  (track as jest.Mock).mockClear();
});

describe("StylePanel telemetry", () => {
  it("warns on low contrast and tracks style updates", async () => {
    Object.assign(translations, {
      "cms.style.foreground": "Foreground",
      "cms.style.fontFamily": "Font family",
      "cms.style.lowContrast": "Low contrast",
      "cms.style.colorPlaceholder": "Color placeholder",
    });
    const component: any = { type: "Button", styles: "" };
    const handleInput = jest.fn((field, value) => {
      component[field] = value;
    });

    await flushPromises();

    const { rerender } = render(
      <StylePanel component={component} handleInput={handleInput} />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Low contrast");

    fireEvent.change(screen.getByLabelText("Foreground"), {
      target: { value: "var(--color-fg)" },
    });
    await flushPromises();
    expect(track).toHaveBeenNthCalledWith(1, "stylepanel:update", {
      group: "color",
      key: "fg",
    });
    expect(component.styles).toBe(
      JSON.stringify({ color: { fg: "var(--color-fg)" }, typography: {} })
    );

    rerender(<StylePanel component={component} handleInput={handleInput} />);
    fireEvent.change(screen.getByLabelText("Font family"), {
      target: { value: "var(--font-sans)" },
    });
    await flushPromises();
    expect(track).toHaveBeenNthCalledWith(2, "stylepanel:update", {
      group: "typography",
      key: "fontFamily",
    });
    expect(component.styles).toBe(
      JSON.stringify({
        color: { fg: "var(--color-fg)" },
        typography: { fontFamily: "var(--font-sans)" },
      })
    );
  });
});
