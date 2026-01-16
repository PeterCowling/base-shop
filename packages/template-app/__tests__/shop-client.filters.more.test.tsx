/** @jest-environment jsdom */
import { render, act } from "@testing-library/react";
import type { SKU } from "@acme/types";

let push: jest.Mock;
let change: (f: any) => void;
let gridProps: any;

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("q=shoe&size=M&color=red&maxPrice=15"),
  useRouter: () => ({ push }),
  usePathname: () => "/en/shop",
}));

jest.mock("@acme/platform-core/components/shop/FilterBar", () => (props: any) => {
  change = props.onChange;
  return null as any;
});

jest.mock("@acme/platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: (props: any) => {
    gridProps = props;
    return null as any;
  },
}));

const skus: SKU[] = [
  { id: "1", title: "Red Shoe", slug: "red-shoe", price: 10, sizes: ["M"], deposit: 0, media: [] },
  { id: "2", title: "Blue Shoe", slug: "blue-shoe", price: 20, sizes: ["L"], deposit: 0, media: [] },
];

describe("ShopClient filters – branch coverage", () => {
  beforeEach(() => {
    push = jest.fn();
  });

  it("applies all filters from URL and updates router on changes", async () => {
    const { default: ShopClient } = await import("../src/app/[lang]/shop/ShopClient.client");
    render(<ShopClient skus={skus} />);
    // With q=size=color=maxPrice filters only 1 item remains
    expect(gridProps.skus).toHaveLength(1);

    // Relax price filter to include both items and ensure router push happens
    act(() => {
      change({ size: "M", color: "red", maxPrice: 100 });
    });
    expect(push).toHaveBeenCalled();
  });
});

