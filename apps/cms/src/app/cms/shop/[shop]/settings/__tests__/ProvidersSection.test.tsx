import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Provider } from "@acme/configurator/providers";
import ProvidersSection from "../sections/ProvidersSection";

jest.mock("@ui", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  FormField: ({ label, error, children }: any) => (
    <fieldset>
      <legend>{label}</legend>
      {children}
      {error}
    </fieldset>
  ),
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  ),
}));

describe("ProvidersSection", () => {
  const providers: Provider[] = [
    { id: "ups", name: "UPS", type: "shipping" },
    { id: "dhl", name: "DHL", type: "shipping" },
  ];

  it("renders providers, toggles selections, and serializes values", () => {
    const onToggle = jest.fn();
    render(
      <ProvidersSection
        providers={providers}
        selected={["ups"]}
        error={undefined}
        onToggle={onToggle}
      />,
    );

    const hidden = screen.getByDisplayValue("ups") as HTMLInputElement;
    expect(hidden.name).toBe("trackingProviders");

    fireEvent.click(screen.getByLabelText("DHL"));
    expect(onToggle).toHaveBeenCalledWith("dhl", true);
  });

  it("displays an error message", () => {
    render(
      <ProvidersSection
        providers={providers}
        selected={[]}
        error={["Select at least one"]}
        onToggle={jest.fn()}
      />,
    );

    expect(screen.getByText("Select at least one")).toHaveAttribute(
      "role",
      "alert",
    );
  });

  it("renders a fallback when no providers available", () => {
    render(
      <ProvidersSection
        providers={[]}
        selected={[]}
        error={undefined}
        onToggle={jest.fn()}
      />,
    );

    expect(
      screen.getByText("No tracking providers available."),
    ).toBeInTheDocument();
  });
});
