import "@testing-library/jest-dom";
import { render, waitFor, act } from "@testing-library/react";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, useState: jest.fn(actual.useState) };
});
import * as React from "react";

jest.mock("../products/fetchCollection", () => ({
  fetchCollection: jest.fn(),
}));

jest.mock("../../../organisms/ProductCarousel", () => ({
  ProductCarousel: ({ products }: { products: unknown[] }) => (
    <div data-testid="carousel">{JSON.stringify(products)}</div>
  ),
}));

jest.mock("@acme/platform-core/products/index", () => ({
  PRODUCTS: [{ id: "mock" }],
}));

import CmsProductCarousel, { getRuntimeProps } from "../ProductCarousel";
import { fetchCollection } from "../products/fetchCollection";
import { PRODUCTS } from "@acme/platform-core/products/index";

describe("CmsProductCarousel", () => {
  let setProducts: jest.Mock;

  beforeEach(() => {
    setProducts = jest.fn();
    (React.useState as jest.Mock).mockImplementation((initial) => [initial, setProducts]);
  });

  afterEach(() => {
    (React.useState as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  it("fetches collection products when collectionId provided", async () => {
    const fetched = [{ id: "1" }, { id: "2" }];
    (fetchCollection as jest.Mock).mockResolvedValueOnce(fetched);

    render(<CmsProductCarousel collectionId="col" />);

    await waitFor(() => expect(setProducts).toHaveBeenCalledWith(fetched));
    expect(fetchCollection).toHaveBeenCalledWith("col");
  });

  it("uses skus without fetching", async () => {
    const skus = [{ id: "a" }];

    render(<CmsProductCarousel skus={skus} />);

    await waitFor(() => expect(setProducts).toHaveBeenCalledWith(skus));
    expect(fetchCollection).not.toHaveBeenCalled();
  });

  it("defaults to empty array when no source provided", async () => {
    render(<CmsProductCarousel />);

    await waitFor(() => expect(setProducts).toHaveBeenCalledWith([]));
    expect(fetchCollection).not.toHaveBeenCalled();
  });

  it("avoids state update after unmount", async () => {
    let resolve: (value: unknown) => void;
    (fetchCollection as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolve = res;
        })
    );

    const { unmount } = render(<CmsProductCarousel collectionId="col" />);
    unmount();

    await act(async () => {
      resolve?.([{ id: "3" }]);
    });

    expect(setProducts).not.toHaveBeenCalled();
  });
});

describe("getRuntimeProps", () => {
  it("returns products from platform core", () => {
    expect(getRuntimeProps()).toEqual({ products: PRODUCTS });
  });
});

