import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShopProvidersSection from "../sections/ShopProvidersSection";
import type { Provider } from "@acme/configurator/providers";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
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

describe("ShopProvidersSection", () => {
  const shippingProviders: Provider[] = [
    { id: "ups", name: "UPS", type: "shipping" },
    { id: "dhl", name: "DHL", type: "shipping" },
    { id: "fedex", name: "FedEx", type: "shipping" },
  ];

  it("calls onChange with updated selections", async () => {
    const onChange = jest.fn();
    render(
      <ShopProvidersSection
        selected={[]}
        providers={shippingProviders}
        errors={{}}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByLabelText("UPS"));
    expect(onChange).toHaveBeenCalledWith(["ups"]);
  });

  it("renders error message when errors provided", () => {
    render(
      <ShopProvidersSection
        selected={[]}
        providers={shippingProviders}
        errors={{ trackingProviders: ["Required"] }}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});
