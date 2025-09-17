import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Shop } from "@acme/types";

import ShopIdentitySection from "../ShopIdentitySection";

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");

  const Card = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  );

  const CardContent = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <section {...props}>{children}</section>
  );

  const Input = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
  >((props, ref) => <input ref={ref} {...props} />);
  Input.displayName = "Input";

  interface CheckboxProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    readonly onCheckedChange?: (checked: boolean) => void;
  }

  const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ onCheckedChange, onChange, ...props }, ref) => (
      <input
        {...props}
        ref={ref}
        type="checkbox"
        onChange={(event) => {
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
      />
    ),
  );
  Checkbox.displayName = "Checkbox";

  return {
    __esModule: true,
    Card,
    CardContent,
    Input,
    Checkbox,
  };
});

function createShop(overrides: Partial<Shop> = {}): Shop {
  const base: Shop = {
    id: "shop_123",
    name: "Maison de Test",
    catalogFilters: [],
    themeId: "atelier-classic",
    themeDefaults: {},
    themeOverrides: {},
    themeTokens: {},
    filterMappings: {},
    priceOverrides: {},
    localeOverrides: {},
    coverageIncluded: true,
    luxuryFeatures: {
      blog: false,
      contentMerchandising: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
      premierDelivery: false,
    },
    componentVersions: {},
    rentalSubscriptions: [],
    subscriptionsEnabled: false,
  };

  return {
    ...base,
    ...overrides,
    luxuryFeatures: {
      ...base.luxuryFeatures,
      ...(overrides.luxuryFeatures ?? {}),
    },
  };
}

describe("ShopIdentitySection", () => {
  it("renders key fields and surfaces validation errors", () => {
    const onInfoChange = jest.fn();
    const onLuxuryFeatureChange = jest.fn();

    render(
      <ShopIdentitySection
        info={createShop()}
        errors={{ name: ["Required"] }}
        onInfoChange={onInfoChange}
        onLuxuryFeatureChange={onLuxuryFeatureChange}
      />,
    );

    expect(screen.getByLabelText("Shop name")).toBeInTheDocument();
    expect(screen.getByLabelText("Theme preset")).toBeInTheDocument();
    expect(screen.getByText("Luxury features")).toBeInTheDocument();

    const nameInput = screen.getByLabelText<HTMLInputElement>("Shop name");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(nameInput).toHaveAttribute("aria-describedby", "shop-name-error");

    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("notifies the parent when the shop name changes", () => {
    const onInfoChange = jest.fn();
    const onLuxuryFeatureChange = jest.fn();

    render(
      <ShopIdentitySection
        info={createShop()}
        onInfoChange={onInfoChange}
        onLuxuryFeatureChange={onLuxuryFeatureChange}
      />,
    );

    const nameInput = screen.getByLabelText<HTMLInputElement>("Shop name");
    fireEvent.change(nameInput, { target: { value: "Maison Demo" } });

    expect(onInfoChange).toHaveBeenCalledWith("name", "Maison Demo");
  });

  it("forwards luxury feature toggles", () => {
    const onInfoChange = jest.fn();
    const onLuxuryFeatureChange = jest.fn();

    render(
      <ShopIdentitySection
        info={createShop()}
        onInfoChange={onInfoChange}
        onLuxuryFeatureChange={onLuxuryFeatureChange}
      />,
    );

    const blogToggle = screen.getByRole<HTMLInputElement>("checkbox", {
      name: /Enable blog/i,
    });
    fireEvent.click(blogToggle);

    expect(onLuxuryFeatureChange).toHaveBeenCalledWith("blog", true);
  });
});
