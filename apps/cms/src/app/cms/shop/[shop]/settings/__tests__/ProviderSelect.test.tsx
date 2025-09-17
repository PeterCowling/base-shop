import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackingProvidersSection from "../sections/TrackingProvidersSection";
import type { Provider } from "@acme/configurator/providers";

describe("TrackingProvidersSection", () => {
  const shippingProviders: Provider[] = [
    { id: "ups", name: "UPS", type: "shipping" },
    { id: "dhl", name: "DHL", type: "shipping" },
    { id: "fedex", name: "FedEx", type: "shipping" },
  ];

  it("calls setTrackingProviders with selected options", async () => {
    const setTrackingProviders = jest.fn();
    render(
      <TrackingProvidersSection
        trackingProviders={[]}
        setTrackingProviders={setTrackingProviders}
        errors={{}}
        shippingProviders={shippingProviders}
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
      <TrackingProvidersSection
        trackingProviders={[]}
        setTrackingProviders={jest.fn()}
        errors={{ trackingProviders: ["Required"] }}
        shippingProviders={shippingProviders}
      />
    );

    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});

