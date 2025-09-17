import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ShopProvidersSection from "../ShopProvidersSection";
import type { Provider } from "@acme/configurator/providers";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    __esModule: true,
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

const shippingProviders: Provider[] = [
  { id: "ups", name: "UPS", type: "shipping" },
  { id: "dhl", name: "DHL", type: "shipping" },
];

describe("ShopProvidersSection", () => {
  it("renders the tracking providers label and toggles providers", async () => {
    const user = userEvent.setup();
    const handleTrackingChange = jest.fn();

    render(
      <ShopProvidersSection
        trackingProviders={[]}
        shippingProviders={shippingProviders}
        onTrackingChange={handleTrackingChange}
      />,
    );

    expect(screen.getByText("Tracking providers")).toBeInTheDocument();

    await user.click(screen.getByLabelText("UPS"));

    expect(handleTrackingChange).toHaveBeenCalledWith(["ups"]);
  });

  it("displays tracking provider errors", () => {
    render(
      <ShopProvidersSection
        trackingProviders={[]}
        shippingProviders={shippingProviders}
        errors={{ trackingProviders: ["Required"] }}
        onTrackingChange={jest.fn()}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Required");
  });
});
