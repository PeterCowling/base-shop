import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopProvidersSection from "../sections/ShopProvidersSection";
import type { Provider } from "@acme/configurator/providers";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
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

  it("calls setTrackingProviders with selected options", async () => {
    const setTrackingProviders = jest.fn();
    render(
      <ShopProvidersSection
        trackingProviders={[]}
        errors={{}}
        shippingProviders={shippingProviders}
        onTrackingChange={setTrackingProviders}
      />
    );

    const select = screen.getByLabelText("Tracking Providers") as HTMLSelectElement;
    const upsOption = screen.getByRole("option", { name: "UPS" }) as HTMLOptionElement;
    const dhlOption = screen.getByRole("option", { name: "DHL" }) as HTMLOptionElement;
    upsOption.selected = true;
    dhlOption.selected = true;
    fireEvent.change(select);
    expect(setTrackingProviders).toHaveBeenCalledWith(["ups", "dhl"]);
  });

  it("renders error message when errors provided", () => {
    render(
      <ShopProvidersSection
        trackingProviders={[]}
        errors={{ trackingProviders: ["Required"] }}
        shippingProviders={shippingProviders}
        onTrackingChange={jest.fn()}
      />
    );

    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});

