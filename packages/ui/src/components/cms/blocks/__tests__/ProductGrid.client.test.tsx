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

jest.mock("@acme/platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: ({ skus }: { skus: unknown[] }) => (
    <div data-testid="grid">{JSON.stringify(skus)}</div>
  ),
}));

import ProductGrid from "../ProductGrid.client";
import { fetchCollection } from "../products/fetchCollection";

describe("ProductGrid.client", () => {
  let setItems: jest.Mock;

  beforeEach(() => {
    setItems = jest.fn();
    (React.useState as jest.Mock).mockImplementation((initial) => [initial, setItems]);
  });

  afterEach(() => {
    (React.useState as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  it("fetches collection SKUs and updates state", async () => {
    const fetched = [
      { id: "1", title: "A" },
      { id: "2", title: "B" },
    ];
    (fetchCollection as jest.Mock).mockResolvedValueOnce(fetched);

    render(<ProductGrid collectionId="col" />);

    await waitFor(() => {
      expect(setItems).toHaveBeenCalledWith(fetched);
    });
  });

  it("uses provided skus without fetching", async () => {
    const skus = [{ id: "3", title: "C" }];

    render(<ProductGrid skus={skus} />);

    await waitFor(() => {
      expect(setItems).toHaveBeenCalledWith(skus);
    });
    expect(fetchCollection).not.toHaveBeenCalled();
  });

  it("prevents state updates after unmount", async () => {
    let resolve: (value: unknown) => void;
    (fetchCollection as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolve = res;
        })
    );

    const { unmount } = render(<ProductGrid collectionId="col" />);
    unmount();

    await act(async () => {
      resolve?.([{ id: "4", title: "D" }]);
    });

    expect(setItems).not.toHaveBeenCalled();
  });
});
