import { render, waitFor } from "@testing-library/react";
import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";
import { StoreLocatorMap } from "../components/organisms/StoreLocatorMap";

function loadLoadLeaflet() {
  const src = readFileSync(
    join(__dirname, "../components/organisms/StoreLocatorMap.tsx"),
    "utf8"
  );
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
  };
  runInNewContext(transpiled, sandbox);
  return sandbox.loadLeaflet as () => Promise<any>;
}

describe("loadLeaflet", () => {
  it("returns null on server", async () => {
    const loadLeaflet = loadLoadLeaflet();
    await expect(loadLeaflet()).resolves.toBeNull();
  });

  it("injects script when needed", async () => {
    const loadLeaflet = loadLoadLeaflet();
    (global as any).window = {};
    (global as any).document = {
      head: document.head,
      body: document.body,
      createElement: document.createElement.bind(document),
    };
    const p = loadLeaflet();
    const script = document.querySelector(
      'script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]'
    ) as HTMLScriptElement;
    expect(script).toBeTruthy();
    (window as any).L = {};
    script.onload!(new Event("load"));
    await expect(p).resolves.toBe(window.L);
  });
});

describe("StoreLocatorMap", () => {
  it("creates map markers", async () => {
    const marker = {
      addTo: jest.fn().mockReturnThis(),
      bindPopup: jest.fn().mockReturnThis(),
    };
    const map = { setView: jest.fn().mockReturnThis(), remove: jest.fn() };
    const L = {
      map: jest.fn(() => map),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => marker),
    };
    (window as any).L = L;
    render(<StoreLocatorMap locations={[{ lat: 1, lng: 2, label: "A" }]} />);
    await waitFor(() => expect(L.map).toHaveBeenCalled());
    expect(L.marker).toHaveBeenCalledWith([1, 2]);
    expect(marker.bindPopup).toHaveBeenCalledWith("A");
  });
});
