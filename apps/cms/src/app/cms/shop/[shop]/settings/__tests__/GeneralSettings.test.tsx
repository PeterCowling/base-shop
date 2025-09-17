import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import GeneralSettings from "../GeneralSettings";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Input: (props: any) => <input {...props} />,
    Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        {...props}
      />
    ),
  }),
  { virtual: true },
);

describe("GeneralSettings", () => {
  const baseInfo = {
    name: "Test Shop",
    themeId: "theme1",
    luxuryFeatures: {
      blog: true,
      contentMerchandising: false,
      raTicketing: true,
      requireStrongCustomerAuth: false,
      strictReturnConditions: true,
      trackingDashboard: false,
      premierDelivery: false,
      fraudReviewThreshold: 5,
    },
  } as any;

  it("renders initial values", () => {
    render(
      <GeneralSettings
        info={baseInfo}
        errors={{}}
        onInfoChange={jest.fn()}
        onLuxuryFeatureChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Shop name")).toHaveValue("Test Shop");
    expect(screen.getByLabelText("Theme preset")).toHaveValue("theme1");
    expect(screen.getByLabelText("Enable blog")).toBeChecked();
    expect(screen.getByLabelText("RA ticketing")).toBeChecked();
  });

  it("surfaces validation errors with alerts", () => {
    render(
      <GeneralSettings
        info={baseInfo}
        errors={{ name: ["Required"], themeId: ["Invalid"] }}
        onInfoChange={jest.fn()}
        onLuxuryFeatureChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("alert", { name: "Required" })).toBeInTheDocument();
    expect(screen.getByRole("alert", { name: "Invalid" })).toBeInTheDocument();
    const nameInput = screen.getByLabelText("Shop name");
    const themeInput = screen.getByLabelText("Theme preset");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(themeInput).toHaveAttribute("aria-invalid", "true");
  });

  it("invokes change handlers", () => {
    const handleInfoChange = jest.fn();
    const handleLuxuryChange = jest.fn();
    render(
      <GeneralSettings
        info={baseInfo}
        errors={{}}
        onInfoChange={handleInfoChange}
        onLuxuryFeatureChange={handleLuxuryChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Shop name"), {
      target: { value: "Updated Shop" },
    });
    expect(handleInfoChange).toHaveBeenCalledWith("name", "Updated Shop");

    fireEvent.click(screen.getByLabelText("Content merchandising"));
    expect(handleLuxuryChange).toHaveBeenCalledWith(
      "contentMerchandising",
      true,
    );
  });
});

