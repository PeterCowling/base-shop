import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import ShopIdentitySection from "../sections/ShopIdentitySection";
import type { Shop } from "@acme/types";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
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

jest.mock(
  "@/components/molecules/FormField",
  () => ({
    FormField: ({ label, htmlFor, error, children }: any) => (
      <div>
        <label htmlFor={htmlFor}>{label}</label>
        {children}
        {error}
      </div>
    ),
  }),
  { virtual: true },
);

describe("ShopIdentitySection", () => {
  const initialInfo = {
    id: "shop-1",
    name: "Test Shop",
    themeId: "theme1",
    catalogFilters: [],
    filterMappings: {},
    priceOverrides: {},
    localeOverrides: {},
    themeDefaults: {},
    themeOverrides: {},
    themeTokens: {},
    luxuryFeatures: {
      blog: true,
      contentMerchandising: false,
      raTicketing: true,
      fraudReviewThreshold: 5,
      requireStrongCustomerAuth: false,
      strictReturnConditions: true,
      trackingDashboard: false,
      premierDelivery: false,
    },
  } as unknown as Shop;

  it("renders initial values", () => {
    render(
      <ShopIdentitySection
        info={initialInfo}
        errors={{}}
        onInfoChange={jest.fn()}
        onLuxuryFeatureChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Test Shop");
    expect(screen.getByLabelText("Theme")).toHaveValue("theme1");
    expect(screen.getByLabelText(/Enable blog/i)).toBeChecked();
    expect(screen.getByLabelText(/RA ticketing/i)).toBeChecked();
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
        onLuxuryFeatureChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    const nameInput = screen.getByDisplayValue("Test Shop");
    const themeInput = screen.getByDisplayValue("theme1");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(themeInput).toHaveAttribute("aria-invalid", "true");
  });

  it("updates values through provided change handlers", () => {
    function Wrapper({ onSave }: { onSave: (info: Shop) => void }) {
      const [info, setInfo] = useState(initialInfo);
      const handleInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setInfo((prev) => ({ ...prev, [name]: value }));
      };
      const handleLuxuryChange = <K extends keyof Shop["luxuryFeatures"]>(
        feature: K,
        value: Shop["luxuryFeatures"][K],
      ) => {
        setInfo((prev) => ({
          ...prev,
          luxuryFeatures: { ...prev.luxuryFeatures, [feature]: value },
        }));
      };

      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(info);
          }}
        >
          <ShopIdentitySection
            info={info}
            errors={{}}
            onInfoChange={handleInfoChange}
            onLuxuryFeatureChange={handleLuxuryChange}
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
