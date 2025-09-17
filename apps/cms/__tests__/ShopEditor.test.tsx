import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopEditor from "../src/app/cms/shop/[shop]/settings/ShopEditor";
import { updateShop } from "@cms/actions/shops.server";

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    return {
      Accordion: ({ items, children, ...props }: any) => {
        const normalizedItems = Array.isArray(items) ? items : undefined;

        if (normalizedItems?.length) {
          return (
            <div {...props}>
              {normalizedItems.map((item: any, index: number) => (
                <div key={index}>
                  <button type="button">{item.title}</button>
                  <div>{item.content}</div>
                </div>
              ))}
            </div>
          );
        }

        return <div {...props}>{children}</div>;
      },
      AccordionItem: ({ children, ...props }: any) => (
        <div {...props}>{children}</div>
      ),
      AccordionTrigger: ({ children, ...props }: any) => {
        const { ["aria-label"]: ariaLabelProp, ...restProps } = props;

        const resolveLabel = (value: any): string | undefined => {
          if (typeof value === "string") {
            return value;
          }
          if (Array.isArray(value)) {
            for (const child of value) {
              const childLabel = resolveLabel(child);
              if (childLabel) {
                return childLabel;
              }
            }
            return undefined;
          }
          if (value?.props?.title) {
            return value.props.title;
          }
          return undefined;
        };

        const label = resolveLabel(children);

        return (
          <button
            type="button"
            aria-label={ariaLabelProp ?? label}
            {...restProps}
          >
            {children}
          </button>
        );
      },
      AccordionContent: ({ children, ...props }: any) => (
        <div {...props}>{children}</div>
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

    const filterMappingsToggle = screen.getByRole("button", {
      name: /filter mappings/i,
    });
    if (!screen.queryByRole("button", { name: /add filter mapping/i })) {
      fireEvent.click(filterMappingsToggle);
    }
    fireEvent.click(
      await screen.findByRole("button", { name: /add filter mapping/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText(/must have key and value/i),
    ).toBeInTheDocument();
    expect(updateShop).not.toHaveBeenCalled();
  });
});
