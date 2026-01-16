/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactElement } from "react";
import PdpClient from "../src/app/[lang]/product/[slug]/PdpClient.client";
import ProductPage, {
  generateStaticParams,
  generateMetadata,
} from "../src/app/[lang]/product/[slug]/page";
import type { SKU } from "@acme/types";

jest.mock("@acme/platform-core/components/pdp/ImageGallery", () => {
  function ImageGalleryMock() {
    return <div data-testid="gallery" />;
  }
  return ImageGalleryMock;
});

jest.mock("@acme/platform-core/components/pdp/SizeSelector", () => {
  function SizeSelectorMock(props: any) {
    return <button data-cy="size" onClick={() => props.onSelect("M")} />;
  }
  return SizeSelectorMock;
});

const addProps: any[] = [];
jest.mock("@acme/platform-core/components/shop/AddToCartButton.client", () => {
  function AddToCartButtonMock(props: any) {
    addProps.push(props);
    return <button data-testid="add" />;
  }
  return AddToCartButtonMock;
});

jest.mock("@acme/ui/components/atoms/Price", () => ({
  Price: ({ amount }: { amount: number }) => <span data-testid="price">{amount}</span>,
}));

import { notFound } from "next/navigation";
jest.mock("next/navigation", () => ({ notFound: jest.fn() }));

const getProduct = jest.fn();
jest.mock("@acme/platform-core/products", () => ({
  getProductBySlug: (s: string) => getProduct(s),
}));

jest.mock("../src/components/CleaningInfo", () => {
  function CleaningInfoMock() {
    return <div data-testid="clean" />;
  }
  return CleaningInfoMock;
});
jest.mock("../src/lib/seo", () => ({
  getStructuredData: () => ({}),
  serializeJsonLd: () => "{}",
}));
jest.mock("../shop.json", () => ({ showCleaningTransparency: true }), {
  virtual: true,
});

const product: SKU = {
  id: "sku1",
  title: "Sneaker",
  description: "Nice shoe",
  price: 100,
  deposit: 0,
  media: [],
  sizes: ["S", "M"],
  slug: "sneaker",
};

describe("Pdp components", () => {
  it("renders product and updates size and quantity", () => {
    render(<PdpClient product={product} />);
    expect(screen.getByText("Sneaker")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("size"));
    expect(addProps[addProps.length - 1]).toMatchObject({ size: "M", quantity: 1 });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
    expect(addProps[addProps.length - 1]).toMatchObject({ size: "M", quantity: 2 });
  });

  it("renders product page", async () => {
    getProduct.mockReturnValue(product);
    const ui = (await ProductPage({
      params: Promise.resolve({ lang: "en", slug: "sneaker" }),
    })) as ReactElement;
    const [script, pdp, clean] = ui.props.children;
    expect(pdp.props.product).toEqual(product);
    expect(clean).toBeTruthy();
  });

  it("returns notFound when product missing", async () => {
    getProduct.mockReturnValue(undefined);
    await ProductPage({ params: Promise.resolve({ lang: "en", slug: "x" }) });
    expect(notFound).toHaveBeenCalled();
  });

  it("generates params and metadata", async () => {
    const params = await generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    getProduct.mockReturnValue(product);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "sneaker" }) });
    expect(meta.title).toContain("Sneaker");
  });
});
