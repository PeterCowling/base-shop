import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ThemeEditorForm from "../ThemeEditorForm";

jest.mock("@acme/design-system/shadcn", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Select: ({ value, onValueChange, children, ...props }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      {...props}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, textValue }: any) => (
    <option value={value}>{textValue}</option>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
}));

jest.mock("@acme/cms-ui/StyleEditor", () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <button onClick={() => onChange({ token: "value" })}>MockStyleEditor</button>
  ),
}));

jest.mock("../ColorThemeSelector", () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <button data-cy="mock-color-theme" onClick={() => onChange({ theme: "mock" })}>
      MockColorThemeSelector
    </button>
  ),
}));

const getContrastMock = jest.fn((fg: string, bg: string) => (fg === "low" || bg === "low" ? 1 : 5));
jest.mock("@acme/cms-ui", () => ({
  getContrast: (...args: [string, string]) => getContrastMock(...args),
}));

// Mock next/image without using a raw <img> to satisfy DS lint rules
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="next-image" {...props} />,
}));

jest.mock("../../../wizard/WizardPreview", () => ({ __esModule: true, default: () => <div>preview</div> }));

describe("ThemeEditorForm", () => {
  it("handles interactions and shows low contrast warning", async () => {
    const onThemeChange = jest.fn();
    const setPalette = jest.fn();
    const onTokensChange = jest.fn();
    const onReset = jest.fn();

    const palettes = [
      {
        name: "high",
        colors: {
          "--color-fg": "high",
          "--color-bg": "bg",
          "--color-primary-fg": "pfg",
          "--color-primary": "p",
        },
      },
      {
        name: "low",
        colors: {
          "--color-fg": "low",
          "--color-bg": "bg",
          "--color-primary-fg": "low",
          "--color-primary": "low",
        },
      },
    ];

    render(
      <ThemeEditorForm
        themes={["light", "dark"]}
        theme="light"
        onThemeChange={onThemeChange}
        colorPalettes={palettes}
        palette="high"
        setPalette={setPalette}
        themeOverrides={{}}
        themeDefaults={{}}
        onTokensChange={onTokensChange}
        onReset={onReset}
      />
    );

    await userEvent.click(screen.getByTestId("mock-color-theme"));
    expect(onTokensChange).toHaveBeenCalledWith({ theme: "mock" });

    await userEvent.click(screen.getByTestId("palette-low"));
    expect(setPalette).toHaveBeenCalledWith("low");

    expect(screen.getByText(/Low contrast/i)).toBeInTheDocument();

    await userEvent.click(screen.getByText("MockStyleEditor"));
    expect(onTokensChange).toHaveBeenCalledWith({ token: "value" });

    await userEvent.click(screen.getByTestId("reset-theme"));
    expect(onReset).toHaveBeenCalled();
  });
});
