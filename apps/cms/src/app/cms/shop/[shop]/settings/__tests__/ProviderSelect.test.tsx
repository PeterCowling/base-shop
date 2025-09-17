import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ShopProvidersSection from "../sections/ShopProvidersSection";
import type { Provider } from "@acme/configurator/providers";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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

describe("ShopProvidersSection", () => {
  const shippingProviders: Provider[] = [
    { id: "ups", name: "UPS", type: "shipping" },
    { id: "dhl", name: "DHL", type: "shipping" },
  ];

  it("calls onTrackingChange when toggled", () => {
    const handleChange = jest.fn();
    render(
      <ShopProvidersSection
        trackingProviders={[]}
        shippingProviders={shippingProviders}
        errors={{}}
        onTrackingChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("UPS"));
    expect(handleChange).toHaveBeenCalledWith(["ups"]);
  });

  it("renders error message when provided", () => {
    render(
      <ShopProvidersSection
        trackingProviders={[]}
        shippingProviders={shippingProviders}
        errors={{ trackingProviders: ["Required"] }}
        onTrackingChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("alert", { name: "Required" })).toBeInTheDocument();
  });
});

