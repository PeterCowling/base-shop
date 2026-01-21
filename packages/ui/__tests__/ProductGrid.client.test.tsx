import "@testing-library/jest-dom";

import * as React from "react";
import { act,render, waitFor } from "@testing-library/react";

import ProductGrid from "../src/components/cms/blocks/ProductGrid.client";
import { fetchCollection } from "../src/components/cms/blocks/products/fetchCollection";

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return { ...actual, useState: jest.fn(actual.useState) };
});

jest.mock("../src/components/cms/blocks/products/fetchCollection", () => ({
  fetchCollection: jest.fn(),
}));

let sortFn = (a: any, b: any) => a.title.localeCompare(b.title);

jest.mock("@acme/platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: ({ skus }: { skus: any[] }) => {
    const sorted = [...skus].sort(sortFn);
    return sorted.length ? (
      <div data-cy="grid">{JSON.stringify(sorted)}</div>
    ) : null;
  },
}));

describe("ProductGrid.client", () => {
  let setItems: (val: any) => void;
  let setItemsMock: jest.Mock;

  beforeEach(() => {
    const realUseState = jest.requireActual("react").useState;
    setItemsMock = jest.fn();
    (React.useState as jest.Mock).mockImplementation((init) => {
      const [state, setState] = realUseState(init);
      setItems = (val: any) => {
        setItemsMock(val);
        return setState(val);
      };
      return [state, setItems];
    });
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
      expect(setItemsMock).toHaveBeenCalledWith(fetched);
    });
  });

  it("does not update state after unmount", async () => {
    let resolve: (value: unknown) => void;
    (fetchCollection as jest.Mock).mockImplementationOnce(
      () => new Promise((r) => (resolve = r))
    );

    const { unmount } = render(<ProductGrid collectionId="col" />);
    unmount();

    await act(async () => {
      resolve?.([{ id: "3", title: "C" }]);
    });

    expect(setItemsMock).not.toHaveBeenCalled();
  });

  it("uses provided skus when collectionId is absent", async () => {
    const skus = [{ id: "3", title: "C" }];

    render(<ProductGrid skus={skus} />);

    await waitFor(() => {
      expect(setItemsMock).toHaveBeenCalledWith(skus);
    });
    expect(fetchCollection).not.toHaveBeenCalled();
  });

  it("updates grid when sort order changes", async () => {
    const skus = [
      { id: "1", title: "B" },
      { id: "2", title: "A" },
    ];
    const { getByTestId } = render(<ProductGrid skus={skus} />);

    expect(getByTestId("grid")).toHaveTextContent(
      JSON.stringify([
        { id: "2", title: "A" },
        { id: "1", title: "B" },
      ])
    );

    sortFn = (a: any, b: any) => b.title.localeCompare(a.title);
    await act(async () => {
      setItems([...skus]);
    });

    expect(getByTestId("grid")).toHaveTextContent(
      JSON.stringify([
        { id: "1", title: "B" },
        { id: "2", title: "A" },
      ])
    );
  });

  it("returns null when product list is empty", () => {
    const { queryByTestId } = render(<ProductGrid skus={[]} />);
    expect(queryByTestId("grid")).toBeNull();
  });
});
