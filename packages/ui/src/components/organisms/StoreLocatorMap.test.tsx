import { render, waitFor } from "@testing-library/react";
import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";
import { StoreLocatorMap } from "./StoreLocatorMap";

function loadLoadLeaflet(env: Record<string, any> = {}) {
  const src = readFileSync(join(__dirname, "StoreLocatorMap.tsx"), "utf8");
  const start = src.indexOf("function loadLeaflet");
  const end = src.indexOf("export function StoreLocatorMap");
  const cut = src.slice(start, end);
  const transpiled = ts.transpileModule(cut, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: any = {
    exports: {},
    module: { exports: {} },
    require,
    window: undefined,
    document: undefined,
    ...env,
  };
  runInNewContext(transpiled, sandbox);
  return sandbox.loadLeaflet as () => Promise<any>;
}

describe("loadLeaflet", () => {
  it("injects script and resolves with Leaflet", async () => {
    const appended: any[] = [];
    const mockDocument = {
      head: { appendChild: jest.fn() },
      body: { appendChild: jest.fn((el: any) => appended.push(el)) },
      createElement: jest.fn(() => ({ onload: null })),
    };
    const mockWindow: any = {};
    const loadLeaflet = loadLoadLeaflet({ window: mockWindow, document: mockDocument });
    const promise = loadLeaflet();
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
    mockWindow.L = {};
    appended[0].onload(new Event("load"));
    await expect(promise).resolves.toBe(mockWindow.L);
  });
});

describe("StoreLocatorMap", () => {
  it("renders markers and updates map on prop change", async () => {
    const markers: any[] = [];
    const markerFactory = (coords: [number, number]) => {
      const marker = {
        addTo: jest.fn().mockReturnThis(),
        bindPopup: jest.fn().mockReturnThis(),
        openPopup: jest.fn(),
        coords,
      };
      markers.push(marker);
      return marker;
    };

    const maps: any[] = [];
    const mapFactory = () => ({
      setView: jest.fn().mockReturnThis(),
      remove: jest.fn(),
    });

    const L = {
      map: jest.fn(() => {
        const m = mapFactory();
        maps.push(m);
        return m;
      }),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(markerFactory),
    };
    (window as any).L = L;

    const { rerender } = render(
      <StoreLocatorMap
        locations={[
          { lat: 1, lng: 2, label: "A" },
          { lat: 3, lng: 4, label: "B" },
        ]}
        zoom={10}
      />
    );

    await waitFor(() => expect(L.map).toHaveBeenCalledTimes(1));
    expect(maps[0].setView).toHaveBeenCalledWith([1, 2], 10);
    expect(markers).toHaveLength(2);
    expect(markers[0].bindPopup).toHaveBeenCalledWith("A");
    expect(markers[1].bindPopup).toHaveBeenCalledWith("B");

    // simulate selecting the second marker
    markers[1].openPopup();
    expect(markers[1].openPopup).toHaveBeenCalled();

    // update locations to move the map
    rerender(
      <StoreLocatorMap
        locations={[{ lat: 5, lng: 6, label: "C" }]}
        zoom={11}
      />
    );

    await waitFor(() => expect(L.map).toHaveBeenCalledTimes(2));
    expect(maps[0].remove).toHaveBeenCalled();
    expect(maps[1].setView).toHaveBeenCalledWith([5, 6], 11);
  });
});
