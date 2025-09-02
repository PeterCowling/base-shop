import { render, screen } from "@testing-library/react";
import { ProductQuickView } from "../ProductQuickView";
import type { SKU } from "@acme/types";
import "../../../../../../test/resetNextMocks";

jest.mock("../../organisms/ProductCard", () => ({
  ProductCard: ({ product }: { product: SKU }) => (
    <div data-testid={`product-${product.id}`} />
  ),
}));

jest.mock("../../atoms/shadcn", () =>
  require("../../../../../../test/__mocks__/shadcnDialogStub.tsx")
);

const product: SKU = {
  id: "1",
  slug: "a",
  title: "Test",
  price: 1,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [{ url: "", type: "image" }],
  sizes: [],
  description: "",
};

describe("ProductQuickView", () => {
  it("uses container dimensions when opened", async () => {
    const container = document.createElement("div");
    (container as any).getBoundingClientRect = () => ({
      width: 320,
      height: 240,
    });

    const { rerender } = render(
      <ProductQuickView
        product={product}
        open={false}
        onOpenChange={() => {}}
        container={container}
      />
    );

    // Open the modal to trigger effect
    rerender(
      <ProductQuickView
        product={product}
        open={true}
        onOpenChange={() => {}}
        container={container}
      />
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog.style.width).toBe("320px");
    expect(dialog.style.height).toBe("240px");

    // Close the modal
    rerender(
      <ProductQuickView
        product={product}
        open={false}
        onOpenChange={() => {}}
        container={container}
      />
    );

    const closed = screen.queryByRole("dialog");
    expect(closed).toBeNull();
    expect((closed as HTMLElement | null)?.style.width).toBeUndefined();
    expect((closed as HTMLElement | null)?.style.height).toBeUndefined();
  });
});
