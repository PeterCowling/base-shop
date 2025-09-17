import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState, ChangeEvent } from "react";
import ShopIdentitySection from "../sections/ShopIdentitySection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    Input: (props: any) => <input {...props} />,
    Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    ),
  }),
  { virtual: true },
);

describe("ShopIdentitySection", () => {
  const initialInfo = {
    name: "Test Shop",
    themeId: "theme1",
    luxuryFeatures: {
      blog: true,
      contentMerchandising: false,
      raTicketing: true,
      fraudReviewThreshold: 5,
      requireStrongCustomerAuth: false,
      strictReturnConditions: true,
      trackingDashboard: false,
    },
  } as any;

  it("renders initial values", () => {
    render(
      <ShopIdentitySection
        info={initialInfo}
        errors={{}}
        onInfoChange={jest.fn()}
        onLuxuryFeatureToggle={jest.fn()}
        onFraudReviewThresholdChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Test Shop");
    expect(screen.getByLabelText("Theme")).toHaveValue("theme1");
    expect(screen.getByLabelText("Enable blog")).toBeChecked();
    expect(screen.getByLabelText("RA ticketing")).toBeChecked();
  });

  it("displays validation errors", () => {
    render(
      <ShopIdentitySection
        info={initialInfo}
        errors={{
          name: ["Required"],
          themeId: ["Invalid"],
        }}
        onInfoChange={jest.fn()}
        onLuxuryFeatureToggle={jest.fn()}
        onFraudReviewThresholdChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    const nameInput = screen.getByDisplayValue("Test Shop");
    const themeInput = screen.getByDisplayValue("theme1");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(themeInput).toHaveAttribute("aria-invalid", "true");
  });

  it("submits edited values via save handler", () => {
    function Wrapper({ onSave }: { onSave: (info: any) => void }) {
      const [info, setInfo] = useState(initialInfo);
      const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
        setInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(info);
          }}
        >
          <ShopIdentitySection
            info={info}
            errors={{}}
            onInfoChange={handleChange}
            onLuxuryFeatureToggle={(feature, value) =>
              setInfo((prev) => ({
                ...prev,
                luxuryFeatures: {
                  ...prev.luxuryFeatures,
                  [feature]: value,
                },
              }))
            }
            onFraudReviewThresholdChange={(value) =>
              setInfo((prev) => ({
                ...prev,
                luxuryFeatures: {
                  ...prev.luxuryFeatures,
                  fraudReviewThreshold: value,
                },
              }))
            }
          />
          <button type="submit">Save</button>
        </form>
      );
    }

    const handleSave = jest.fn();
    render(<Wrapper onSave={handleSave} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Updated Shop" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated Shop" }),
    );
  });
});

