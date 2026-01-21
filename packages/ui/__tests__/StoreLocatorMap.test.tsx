import { render, waitFor } from "@testing-library/react";
import { readFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { runInNewContext } from "vm";

import { StoreLocatorMap } from "../src/components/organisms/StoreLocatorMap";

function loadLoadLeaflet(env: Record<string, any> = {}) {
  const src = readFileSync(
    join(__dirname, "../src/components/organisms/StoreLocatorMap.tsx"),
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
    ...env,
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
    const appended: any[] = [];
    const mockDocument = {
      head: { appendChild: jest.fn() },
      body: { appendChild: jest.fn((el: any) => appended.push(el)) },
      createElement: jest.fn(() => ({ onload: null })),
    };
    const mockWindow: any = {};
    const loadLeaflet = loadLoadLeaflet({ window: mockWindow, document: mockDocument });
    const p = loadLeaflet();
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
    mockWindow.L = {};
    appended[0].onload(new Event("load"));
    await expect(p).resolves.toBe(mockWindow.L);
  });

  it("resolves null on script error", async () => {
    const appended: any[] = [];
    const mockDocument = {
      head: { appendChild: jest.fn() },
      body: { appendChild: jest.fn((el: any) => appended.push(el)) },
      createElement: jest.fn(() => ({ onerror: null })),
    };
    const mockWindow: any = {};
    const loadLeaflet = loadLoadLeaflet({ window: mockWindow, document: mockDocument });
    const p = loadLeaflet();
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
    appended[0].onerror(new Event("error"));
    await expect(p).resolves.toBeNull();
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

  it("cleans up map on unmount", async () => {
    const map = { setView: jest.fn().mockReturnThis(), remove: jest.fn() };
    const L = {
      map: jest.fn(() => map),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      marker: jest.fn(() => ({ addTo: jest.fn().mockReturnThis(), bindPopup: jest.fn().mockReturnThis() })),
    };
    (window as any).L = L;
    const { unmount } = render(
      <StoreLocatorMap locations={[{ lat: 51.5, lng: -0.1 }]} />
    );
    await waitFor(() => expect(L.map).toHaveBeenCalled());
    unmount();
    expect(map.remove).toHaveBeenCalled();
  });

  it("binds empty popup content when label missing", async () => {
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
    render(<StoreLocatorMap locations={[{ lat: 1, lng: 2 }]} />);
    await waitFor(() => expect(L.map).toHaveBeenCalled());
    expect(marker.bindPopup).toHaveBeenCalledWith("");
  });

  it("uses default height class", () => {
    const { container } = render(
      <StoreLocatorMap locations={[{ lat: 1, lng: 2 }]} />
    );
    const div = container.querySelector("div") as HTMLElement;
    expect(div.className).toContain("h-96");
  });

  it("applies custom height class", () => {
    const { container } = render(
      <StoreLocatorMap heightClass="h-40" locations={[{ lat: 1, lng: 2 }]} />
    );
    const div = container.querySelector("div") as HTMLElement;
    expect(div.className).toContain("h-40");
  });
});
