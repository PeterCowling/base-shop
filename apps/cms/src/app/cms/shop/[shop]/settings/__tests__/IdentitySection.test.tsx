import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import IdentitySection, {
  type IdentitySectionProps,
} from "../sections/IdentitySection";

jest.mock("@ui", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  FormField: ({ label, htmlFor, error, children }: any) => (
    <label htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {error}
    </label>
  ),
  Input: (props: any) => <input {...props} />,
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  ),
}));

describe("IdentitySection", () => {
  const baseProps: IdentitySectionProps = {
    values: {
      name: "Test Shop",
      themeId: "theme-1",
      luxuryFeatures: {
        blog: true,
        contentMerchandising: false,
        raTicketing: false,
        fraudReviewThreshold: 5,
        requireStrongCustomerAuth: false,
        strictReturnConditions: false,
        trackingDashboard: true,
      },
    },
    errors: {},
    onNameChange: jest.fn(),
    onThemeIdChange: jest.fn(),
    onLuxuryFeatureChange: jest.fn(),
  };

  it("renders values and surfaces errors", () => {
    const props: IdentitySectionProps = {
      ...baseProps,
      errors: { name: ["Required"] },
    };
    render(<IdentitySection {...props} />);

    expect(screen.getByLabelText(/Name/)).toHaveValue("Test Shop");
    expect(screen.getByLabelText(/Name/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText(/Theme/)).toHaveValue("theme-1");
  });

  it("calls change handlers for text fields and feature toggles", () => {
    const onNameChange = jest.fn();
    const onThemeIdChange = jest.fn();
    const onLuxuryFeatureChange = jest.fn();
    render(
      <IdentitySection
        {...baseProps}
        onNameChange={onNameChange}
        onThemeIdChange={onThemeIdChange}
        onLuxuryFeatureChange={onLuxuryFeatureChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Updated" },
    });
    expect(onNameChange).toHaveBeenCalledWith("Updated");

    fireEvent.change(screen.getByLabelText(/Theme/), {
      target: { value: "custom" },
    });
    expect(onThemeIdChange).toHaveBeenCalledWith("custom");

    fireEvent.click(screen.getByLabelText("Enable blog"));
    expect(onLuxuryFeatureChange).toHaveBeenCalledWith("blog", false);

    fireEvent.change(screen.getByLabelText("Fraud review threshold"), {
      target: { value: "10" },
    });
    expect(onLuxuryFeatureChange).toHaveBeenCalledWith(
      "fraudReviewThreshold",
      10,
    );
  });

  it("serializes enabled checkbox values", () => {
    render(<IdentitySection {...baseProps} />);
    const hiddenInputs = screen.getAllByDisplayValue("on") as HTMLInputElement[];
    expect(hiddenInputs.map((input) => input.name)).toContain("blog");
    expect(hiddenInputs.map((input) => input.name)).toContain("trackingDashboard");
  });
});
