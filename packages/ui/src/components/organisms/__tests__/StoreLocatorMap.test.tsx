// packages/ui/src/components/organisms/__tests__/StoreLocatorMap.test.tsx
import { render, waitFor } from "@testing-library/react";

import { StoreLocatorMap } from "../StoreLocatorMap";

describe("StoreLocatorMap", () => { // i18n-exempt: test titles
  afterEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete (window as { L?: unknown }).L;
  });

  test("loads Leaflet assets and renders markers", async () => { // i18n-exempt: test title
    const mapInstance: any = { remove: jest.fn() };
    mapInstance.setView = jest.fn(() => mapInstance);

    const tileAddTo = jest.fn();
    const markerBindPopup = jest.fn();
    const markerAddTo = jest.fn(() => ({ bindPopup: markerBindPopup }));

    const L = {
      map: jest.fn(() => mapInstance),
      tileLayer: jest.fn(() => ({ addTo: tileAddTo })),
      marker: jest.fn(() => ({ addTo: markerAddTo })),
    };

    const appendHead = jest.spyOn(document.head, "appendChild");
    const appendBody = jest.spyOn(document.body, "appendChild");
    let scriptEl: HTMLScriptElement | null = null;
    appendBody.mockImplementation((node: Node) => {
      if (node instanceof HTMLScriptElement) {
        scriptEl = node;
      }
      return Node.prototype.appendChild.call(document.body, node);
    });

    const { unmount } = render(
      <StoreLocatorMap
        locations={[
          { lat: 1, lng: 2, label: "A" },
          { lat: 3, lng: 4 },
        ]}
        zoom={7}
        className="extra"
      />
    );

    expect(appendHead).toHaveBeenCalled();
    expect(appendBody).toHaveBeenCalled();

    (window as { L?: typeof L }).L = L;
    (scriptEl as HTMLScriptElement | null)?.onload?.(new Event("load"));

    await waitFor(() => expect(L.map).toHaveBeenCalled());
    expect(L.map).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(mapInstance.setView).toHaveBeenCalledWith([1, 2], 7);
    expect(tileAddTo).toHaveBeenCalledWith(mapInstance);
    expect(markerAddTo).toHaveBeenCalledTimes(2);
    expect(markerBindPopup).toHaveBeenNthCalledWith(1, "A");
    expect(markerBindPopup).toHaveBeenNthCalledWith(2, "");

    unmount();
    expect(mapInstance.remove).toHaveBeenCalled();

    appendHead.mockRestore();
    appendBody.mockRestore();
  });

  test("skips initialization when no locations are provided", () => { // i18n-exempt: test title
    (window as { L?: unknown }).L = {
      map: jest.fn(),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => ({ addTo: jest.fn(() => ({ bindPopup: jest.fn() })) })),
    };

    render(<StoreLocatorMap locations={[]} />);

    expect(((window as { L?: any }).L as any).map).not.toHaveBeenCalled();
  });

  test("prefers legacy height prop when provided", () => { // i18n-exempt: test title
    (window as { L?: unknown }).L = {
      map: jest.fn(() => ({ setView: jest.fn(() => ({ remove: jest.fn() })) })),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => ({ addTo: jest.fn(() => ({ bindPopup: jest.fn() })) })),
    };

    const { container } = render(
      <StoreLocatorMap
        locations={[{ lat: 1, lng: 1 }]}
        height="h-24"
        heightClass="h-96"
        className="extra"
      />
    );

    expect(container.firstChild).toHaveClass("h-24");
    expect(container.firstChild).toHaveClass("w-full");
    expect(container.firstChild).toHaveClass("extra");
  });
});
