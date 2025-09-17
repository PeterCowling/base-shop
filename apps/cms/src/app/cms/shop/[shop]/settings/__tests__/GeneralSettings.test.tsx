import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopIdentitySection from "../sections/ShopIdentitySection";

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

describe("ShopIdentitySection", () => {
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
      <ShopIdentitySection
        info={baseInfo}
        errors={{}}
        onInfoChange={jest.fn()}
        onLuxuryFeatureChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Shop name")).toHaveValue("Test Shop");
    expect(screen.getByLabelText("Theme preset")).toHaveValue("theme1");
    expect(
      screen.getByRole("checkbox", { name: /Enable blog/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /RA ticketing/ }),
    ).toBeChecked();
  });

  it("surfaces validation errors with alerts", () => {
    render(
      <ShopIdentitySection
        info={baseInfo}
        errors={{ name: ["Required"], themeId: ["Invalid"] }}
        onInfoChange={jest.fn()}
        onLuxuryFeatureChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Required")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Invalid")).toHaveAttribute("role", "alert");
    const nameInput = screen.getByLabelText("Shop name");
    const themeInput = screen.getByLabelText("Theme preset");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(themeInput).toHaveAttribute("aria-invalid", "true");
  });

  it("invokes change handlers", () => {
    const handleInfoChange = jest.fn();
    const handleLuxuryChange = jest.fn();
    render(
      <ShopIdentitySection
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

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Content merchandising/ }),
    );
    expect(handleLuxuryChange).toHaveBeenCalledWith(
      "contentMerchandising",
      true,
    );
  });
});

