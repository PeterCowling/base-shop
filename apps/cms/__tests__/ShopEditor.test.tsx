import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopEditor from "../src/app/cms/shop/[shop]/settings/ShopEditor";
import { updateShop } from "@cms/actions/shops.server";

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    return {
      Accordion: ({ items }: any) => (
        <div>
          {items.map((item: any, index: number) => (
            <div key={index}>
              <button type="button">{item.title}</button>
              <div>{item.content}</div>
            </div>
          ))}
        </div>
      ),
      Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      CardContent: ({ children, ...props }: any) => (
        <div {...props}>{children}</div>
      ),
      Button: ({ asChild, children, ...props }: any) => (
        <button {...props}>{children}</button>
      ),
      Input: (props: any) => <input {...props} />,
      Checkbox: ({ onCheckedChange, ...props }: any) => (
        <input type="checkbox" onChange={onCheckedChange} {...props} />
      ),
      Textarea: (props: any) => <textarea {...props} />,
    };
  },
  { virtual: true },
);

jest.mock("@cms/actions/shops.server", () => ({
  updateShop: jest.fn(),
  resetThemeOverride: jest.fn(),
}));

describe("ShopEditor", () => {
  it("shows error for invalid mapping and prevents submission", async () => {
    const initial = {
      id: "1",
      name: "Test",
      themeId: "base",
      catalogFilters: [],
      themeOverrides: {},
      themeTokens: {},
      filterMappings: {},
      priceOverrides: {},
      localeOverrides: {},
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
    };

    render(
      <ShopEditor shop="shop" initial={initial} initialTrackingProviders={[]} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /filter mappings/i }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /add mapping/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText(/must have key and value/i),
    ).toBeInTheDocument();
    expect(updateShop).not.toHaveBeenCalled();
  });
});
