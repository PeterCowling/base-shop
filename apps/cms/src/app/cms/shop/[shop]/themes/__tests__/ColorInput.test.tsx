/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
 
import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { getContrast, suggestContrastColor } from "@acme/ui/components/cms";

import ColorInput from "../ColorInput";

// Mock shadcn components
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: (props: ComponentProps<"button">) => <button {...props} />,
    Input: (props: ComponentProps<"input">) => <input {...props} />,
  }),
  { virtual: true },
);

// Mock Tooltip
jest.mock("@acme/ui/components/atoms", () => ({
  Tooltip: ({ children }: { children: React.ReactNode; text: string }) => <>{children}</>,
}));

// Mock i18n
jest.mock("@acme/i18n/Translations", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock usageMap
jest.mock("../usageMap", () => ({
  getUsageText: () => "Used in buttons",
}));

describe("ColorInput", () => {
  const baseProps = {
    name: "--color-primary",
    defaultValue: "220 90% 50%",
    value: "",
    onChange: jest.fn(),
    onReset: jest.fn(),
    tokens: {
      "--color-primary": "220 90% 50%",
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 10%",
    },
    textTokens: ["--color-fg"],
    bgTokens: ["--color-bg"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default value", () => {
    render(<ColorInput {...baseProps} />);
    expect(screen.getByLabelText("--color-primary")).toBeInTheDocument();
  });

  it("shows reset button when override is present", () => {
    render(<ColorInput {...baseProps} value="220 90% 60%" />);
    expect(screen.getByText("actions.reset")).toBeInTheDocument();
  });

  it("does not show reset button without override", () => {
    render(<ColorInput {...baseProps} />);
    expect(screen.queryByText("actions.reset")).not.toBeInTheDocument();
  });

  it("calls onReset when reset button clicked", () => {
    const onReset = jest.fn();
    render(<ColorInput {...baseProps} value="220 90% 60%" onReset={onReset} />);
    fireEvent.click(screen.getByText("actions.reset"));
    expect(onReset).toHaveBeenCalled();
  });

  it("calls onChange when color picker changes", () => {
    const onChange = jest.fn();
    render(<ColorInput {...baseProps} onChange={onChange} />);
    const colorInput = document.querySelector('input[type="color"]');
    expect(colorInput).toBeInTheDocument();
    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: "#ff0000" } });
      expect(onChange).toHaveBeenCalled();
    }
  });

  it("applies warning styles when overridden", () => {
    const { container } = render(<ColorInput {...baseProps} value="220 90% 60%" />);
    const label = container.querySelector("label");
    expect(label?.className).toContain("bg-warning-soft");
  });
});

describe("getContrast utility", () => {
  it("returns high contrast ratio for black on white", () => {
    const ratio = getContrast("#ffffff", "#000000");
    expect(ratio).toBeGreaterThanOrEqual(21);
  });

  it("returns low contrast for similar colors", () => {
    const ratio = getContrast("#cccccc", "#dddddd");
    expect(ratio).toBeLessThan(4.5);
  });

  it("works with HSL input", () => {
    const ratio = getContrast("0 0% 100%", "0 0% 0%");
    expect(ratio).toBeGreaterThanOrEqual(21);
  });
});

describe("suggestContrastColor utility", () => {
  it("suggests darker color for light foreground on light background", () => {
    const suggested = suggestContrastColor("0 0% 80%", "0 0% 100%");
    expect(suggested).not.toBeNull();
    if (suggested) {
      const ratio = getContrast(suggested, "0 0% 100%");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("suggests lighter color for dark foreground on dark background", () => {
    const suggested = suggestContrastColor("0 0% 20%", "0 0% 0%");
    expect(suggested).not.toBeNull();
    if (suggested) {
      const ratio = getContrast(suggested, "0 0% 0%");
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("returns null when no solution is possible", () => {
    // Very extreme case where lightness can't be adjusted enough
    const suggested = suggestContrastColor("0 0% 50%", "0 0% 50%", 100);
    expect(suggested).toBeNull();
  });

  it("works with hex input and returns hex", () => {
    const suggested = suggestContrastColor("#cccccc", "#ffffff");
    expect(suggested).not.toBeNull();
    expect(suggested?.startsWith("#")).toBe(true);
  });
});
