import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import OverridesSection from "../sections/OverridesSection";

jest.mock("@ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  FormField: ({ label, error, children }: any) => (
    <div>
      <span>{label}</span>
      {children}
      {error}
    </div>
  ),
  Input: (props: any) => <input {...props} />,
}));

const resetThemeOverride = jest.fn();
jest.mock("@cms/actions/shops.server", () => ({
  resetThemeOverride: (...args: any[]) => resetThemeOverride(...args),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe("OverridesSection", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const priceOverrides = {
    rows: [{ key: "en", value: "10" }],
    onAdd: jest.fn(),
    onUpdate: jest.fn(),
    onRemove: jest.fn(),
    error: ["Invalid price"],
  };

  const theme = {
    rows: [
      { token: "color", defaultValue: "#fff", overrideValue: "#000" },
      { token: "spacing", defaultValue: "1rem" },
    ],
    defaults: { color: "#fff" },
    overrides: { color: "#000" },
    errors: { themeOverrides: ["Invalid override"] },
  };

  it("wires price override controls and theme reset", () => {
    render(
      <OverridesSection shop="demo" priceOverrides={priceOverrides} theme={theme} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Locale"), {
      target: { value: "de" },
    });
    expect(priceOverrides.onUpdate).toHaveBeenCalledWith(0, "key", "de");

    fireEvent.change(screen.getByPlaceholderText("Price"), {
      target: { value: "20" },
    });
    expect(priceOverrides.onUpdate).toHaveBeenCalledWith(0, "value", "20");

    fireEvent.click(screen.getByText("Add override"));
    expect(priceOverrides.onAdd).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(priceOverrides.onRemove).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText("Reset"));
    expect(resetThemeOverride).toHaveBeenCalledWith("demo", "color", expect.any(FormData));

    const defaults = screen.getByDisplayValue(
      JSON.stringify(theme.defaults),
    ) as HTMLInputElement;
    expect(defaults.name).toBe("themeDefaults");
    const overrides = screen.getByDisplayValue(
      JSON.stringify(theme.overrides),
    ) as HTMLInputElement;
    expect(overrides.name).toBe("themeOverrides");

    expect(screen.getByText("Invalid price")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Invalid override")).toHaveAttribute("role", "alert");
  });
});
