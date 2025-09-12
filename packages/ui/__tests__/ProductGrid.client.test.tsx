import "@testing-library/jest-dom";
import { render, waitFor, act } from "@testing-library/react";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, useState: jest.fn(actual.useState) };
});
import * as React from "react";

jest.mock("../src/components/cms/blocks/products/fetchCollection", () => ({
  fetchCollection: jest.fn(),
}));

jest.mock("@acme/platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: ({ skus }: { skus: unknown[] }) => (
    <div data-testid="grid">{JSON.stringify(skus)}</div>
  ),
}));

import ProductGrid from "../src/components/cms/blocks/ProductGrid.client";
import { fetchCollection } from "../src/components/cms/blocks/products/fetchCollection";

describe("ProductGrid.client", () => {
  let setItems: jest.Mock;

  beforeEach(() => {
    setItems = jest.fn();
    (React.useState as jest.Mock).mockImplementation((init) => [
      init,
      setItems,
    ]);
  });

  afterEach(() => {
    (React.useState as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  it("fetches collection SKUs when collectionId is provided", async () => {
    const fetched = [
      { id: "1", title: "A" },
      { id: "2", title: "B" },
    ];
    (fetchCollection as jest.Mock).mockResolvedValueOnce(fetched);

    render(<ProductGrid collectionId="col" />);

    await waitFor(() => {
      expect(fetchCollection).toHaveBeenCalledWith("col");
      expect(setItems).toHaveBeenCalledWith(fetched);
    });
  });

  it("does not update state after unmount", async () => {
    let resolve: (value: unknown) => void;
    (fetchCollection as jest.Mock).mockImplementationOnce(
      () => new Promise((res) => (resolve = res))
    );

    const { unmount } = render(<ProductGrid collectionId="col" />);
    unmount();

    await act(async () => {
      resolve?.([{ id: "3", title: "C" }]);
    });

    expect(setItems).not.toHaveBeenCalled();
  });

  it("uses provided skus when collectionId is absent", async () => {
    const skus = [{ id: "3", title: "C" }];

    render(<ProductGrid skus={skus} />);

    await waitFor(() => {
      expect(setItems).toHaveBeenCalledWith(skus);
    });
    expect(fetchCollection).not.toHaveBeenCalled();
  });
});
