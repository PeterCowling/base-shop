import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { track } from "@acme/telemetry";
import ShopChooser from "../ShopChooser";

jest.mock("@acme/telemetry", () => ({
  track: jest.fn(),
}));

describe("ShopChooser", () => {
  const baseProps = {
    tag: "Testing",
    heading: "Workspace heading",
    subheading: "Workspace description",
    shops: ["alpha", "beta", "gamma"],
    card: {
      icon: "🧪",
      title: (shop: string) => shop.toUpperCase(),
      description: (shop: string) => `Test description for ${shop}.`,
      ctaLabel: () => "Open workspace",
      href: (shop: string) => `/cms/test/${shop}`,
      analyticsEventName: "shopchooser:navigate",
      analyticsPayload: (shop: string) => ({ area: "test", shop }),
    },
    emptyState: {
      tagLabel: "No shops yet",
      title: "Create your first shop",
      description: "Spin up a storefront to explore the workspace.",
      ctaLabel: "Create shop",
      ctaHref: "/cms/configurator",
      analyticsEventName: "shopchooser:create",
      analyticsPayload: { area: "test" },
    },
  } as const;

  beforeEach(() => {
    (track as jest.Mock).mockClear();
  });

  it("renders shop cards and tracks CTA clicks", async () => {
    render(<ShopChooser {...baseProps} />);

    expect(screen.getByText("Workspace heading")).toBeInTheDocument();
    const links = screen.getAllByTestId("shop-chooser-cta");
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute("data-index"))).toEqual([
      "0",
      "1",
      "2",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      baseProps.shops.map((shop) => `/cms/test/${shop}`)
    );

    links.forEach((link) =>
      link.addEventListener("click", (event) => event.preventDefault())
    );

    const user = userEvent.setup();
    await user.click(links[1]);

    expect(track).toHaveBeenCalledWith("shopchooser:navigate", {
      area: "test",
      shop: "beta",
    });
  });

  it("renders an empty state with CTA analytics when no shops exist", async () => {
    render(<ShopChooser {...baseProps} shops={[]} />);

    expect(screen.getByText("Create your first shop")).toBeInTheDocument();
    const createLink = screen.getByRole("link", { name: "Create shop" });

    const user = userEvent.setup();
    await user.click(createLink);

    expect(track).toHaveBeenCalledWith("shopchooser:create", { area: "test" });
  });

  it("allows keyboard navigation across CTA buttons", async () => {
    render(<ShopChooser {...baseProps} />);
    const ctas = screen.getAllByTestId("shop-chooser-cta");

    const user = userEvent.setup();
    await user.tab();
    expect(ctas[0]).toHaveFocus();

    await user.tab();
    expect(ctas[1]).toHaveFocus();

    await user.tab();
    expect(ctas[2]).toHaveFocus();
  });
});
