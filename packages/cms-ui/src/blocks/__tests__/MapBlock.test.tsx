import { render } from "@testing-library/react";

import MapBlock from "../MapBlock";

jest.mock("@acme/ui/components/organisms/StoreLocatorMap", () => {
  const React = require("react");
  return {
    __esModule: true,
    StoreLocatorMap: jest.fn(({ locations }: any) => (
      <iframe
        data-cy="map"
        src={`https://maps.example/?lat=${locations[0].lat}&lng=${locations[0].lng}`}
        title="map"
      />
    )),
  };
});

const { StoreLocatorMap } = require("@acme/ui/components/organisms/StoreLocatorMap") as {
  StoreLocatorMap: jest.Mock;
};

const mockStoreLocatorMap = StoreLocatorMap;

describe("MapBlock", () => {
  afterEach(() => {
    mockStoreLocatorMap.mockClear();
  });

  it("renders StoreLocatorMap with correct props when coordinates are numeric", () => {
    const { getByTestId } = render(<MapBlock lat={1} lng={2} zoom={5} />);
    const iframe = getByTestId("map") as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain("lat=1");
    expect(iframe.src).toContain("lng=2");
    expect(mockStoreLocatorMap).toHaveBeenCalledTimes(1);
    expect(mockStoreLocatorMap.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        locations: [{ lat: 1, lng: 2 }],
        zoom: 5,
        heightClass: "h-full",
      })
    );
  });

  it("renders map without address label", () => {
    render(<MapBlock lat={3} lng={4} />);
    expect(mockStoreLocatorMap).toHaveBeenCalledTimes(1);
    expect(mockStoreLocatorMap.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        locations: [{ lat: 3, lng: 4 }],
        heightClass: "h-full",
      })
    );
  });

  it.each([
    { lat: undefined, lng: 1 },
    { lat: 1, lng: undefined },
    { lat: undefined, lng: undefined },
    { lat: "1" as any, lng: 2 },
    { lat: 1, lng: "2" as any },
    { lat: "1" as any, lng: "2" as any },
  ])("returns null when lat/lng invalid: %o", (props) => {
    const { container } = render(<MapBlock {...(props as any)} />);
    expect(container.firstChild).toBeNull();
    expect(mockStoreLocatorMap).not.toHaveBeenCalled();
  });
});

