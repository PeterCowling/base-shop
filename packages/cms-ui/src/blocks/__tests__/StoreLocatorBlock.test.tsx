import { render } from "@testing-library/react";

import StoreLocatorBlock from "../StoreLocatorBlock";

jest.mock("../../../organisms/StoreLocatorMap", () => {
  const React = require("react");
  return {
    __esModule: true,
    StoreLocatorMap: jest.fn(() => <div data-cy="map-view" />),
  };
});

const { StoreLocatorMap } = require("../../../organisms/StoreLocatorMap") as {
  StoreLocatorMap: jest.Mock;
};

const mockStoreLocatorMap = StoreLocatorMap;

describe("StoreLocatorBlock", () => {
  const locations = [
    { lat: 1, lng: 2, label: "A" },
    { lat: 3, lng: 4, label: "B" },
  ];

  afterEach(() => {
    mockStoreLocatorMap.mockReset();
    mockStoreLocatorMap.mockImplementation(() => <div data-cy="map-view" />);
  });

  it("switches between map and list modes", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <StoreLocatorBlock locations={locations} />
    );
    expect(mockStoreLocatorMap).toHaveBeenCalledTimes(1);
    expect(mockStoreLocatorMap.mock.calls[0][0].locations).toEqual(locations);
    expect(getByTestId("map-view")).toBeInTheDocument();

    mockStoreLocatorMap.mockImplementationOnce(() => (
      <ul data-cy="list-view">
        {locations.map((loc) => (
          <li key={loc.label}>{loc.label}</li>
        ))}
      </ul>
    ));

    rerender(<StoreLocatorBlock locations={locations} />);
    expect(mockStoreLocatorMap).toHaveBeenCalledTimes(2);
    expect(mockStoreLocatorMap.mock.calls[1][0].locations).toEqual(locations);
    expect(queryByTestId("map-view")).not.toBeInTheDocument();
    expect(getByTestId("list-view")).toBeInTheDocument();
  });

  it("renders null for empty locations", () => {
    const { container } = render(<StoreLocatorBlock locations={[]} />);
    expect(container.firstChild).toBeNull();
    expect(mockStoreLocatorMap).not.toHaveBeenCalled();
  });
});
