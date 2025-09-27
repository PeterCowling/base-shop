/** @jest-environment jsdom */
/** @jest-environment jsdom */
import { render, act } from "@testing-library/react";
import type { ReactElement } from "react";
import ShopClient from "../src/app/[lang]/shop/ShopClient.client";
import ShopPage from "../src/app/[lang]/shop/page";
import type { SKU } from "@acme/types";

const push = jest.fn();
let change: any;
let gridProps: any;

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("q=red"),
  useRouter: () => ({ push }),
  usePathname: () => "/en/shop",
}));

jest.mock("@platform-core/components/shop/FilterBar", () => {
  function FilterBarMock(props: any) {
    change = props.onChange;
    return <div data-testid="filters" />;
  }
  return FilterBarMock;
});

jest.mock("@platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: (props: any) => {
    gridProps = props;
    return <div data-testid="grid" />;
  },
}));

jest.mock("../src/lib/seo", () => ({
  getStructuredData: () => ({}),
  serializeJsonLd: () => "{}",
}));

const skus: SKU[] = [
  { id: "1", title: "Red Shoe", slug: "red-shoe", price: 10, sizes: ["M"], deposit: 0, media: [] },
  { id: "2", title: "Blue Shoe", slug: "blue-shoe", price: 20, sizes: ["M"], deposit: 0, media: [] },
];

describe("Shop components", () => {
  it("filters products by query and pushes on change", () => {
    render(<ShopClient skus={skus} />);
    expect(gridProps.skus).toHaveLength(1);
    act(() => {
      change({ color: "red" });
    });
    expect(push).toHaveBeenCalled();
  });

  it("renders shop page", async () => {
    const ui = (await ShopPage({ params: Promise.resolve({ lang: "en" }) })) as ReactElement;
    const [, shop] = ui.props.children;
    expect(shop.props.skus).toHaveLength(3);
  });
});
