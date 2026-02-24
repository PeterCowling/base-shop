import {
  clearSampleTextPixelsCache,
  sampleTextPixels,
} from "./sampleTextPixels";

type MockContext2D = {
  font: string;
  fillStyle: string;
  textBaseline: CanvasTextBaseline;
  measureText: jest.Mock<{ width: number }, [string]>;
  clearRect: jest.Mock<void, [number, number, number, number]>;
  fillText: jest.Mock<void, [string, number, number]>;
  getImageData: jest.Mock<ImageData, [number, number, number, number]>;
};

function makeContext(widthHint = 40): MockContext2D {
  return {
    font: "",
    fillStyle: "",
    textBaseline: "top",
    measureText: jest.fn(() => ({ width: widthHint })),
    clearRect: jest.fn(),
    fillText: jest.fn(),
    getImageData: jest.fn((_x, _y, width, height) => {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let y = 2; y < height; y += 4) {
        for (let x = 2; x < width; x += 4) {
          data[(y * width + x) * 4 + 3] = 255;
        }
      }

      return {
        data,
        width,
        height,
      } as ImageData;
    }),
  };
}

describe("BrandMark sampleTextPixels", () => {
  afterEach(() => {
    clearSampleTextPixelsCache();
    jest.restoreAllMocks();
  });

  it("returns bounded sampled points and dimensions", () => {
    const ctx = makeContext(48);
    const originalCreateElement = document.createElement.bind(document);

    jest
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === "canvas") {
          const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
          Object.defineProperty(canvas, "getContext", {
            configurable: true,
            value: jest.fn(() => ctx),
          });
          return canvas;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as typeof document.createElement);

    const sampled = sampleTextPixels({
      text: "Un solo dettaglio",
      font: "400 22px 'DM Sans'",
      sampleStep: 2,
    });

    expect(sampled.width).toBeGreaterThan(0);
    expect(sampled.height).toBeGreaterThan(0);
    expect(sampled.points.length).toBeGreaterThan(0);
    expect(
      sampled.points.every(
        (point) =>
          point.x >= 0 &&
          point.y >= 0 &&
          point.x < sampled.width &&
          point.y < sampled.height
      )
    ).toBe(true);
  });

  it("returns cached results for identical input", () => {
    const ctx = makeContext(28);
    const originalCreateElement = document.createElement.bind(document);

    jest
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === "canvas") {
          const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
          Object.defineProperty(canvas, "getContext", {
            configurable: true,
            value: jest.fn(() => ctx),
          });
          return canvas;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as typeof document.createElement);

    const first = sampleTextPixels({
      text: "Carina",
      font: "500 64px 'Cormorant Garamond'",
    });
    const second = sampleTextPixels({
      text: "Carina",
      font: "500 64px 'Cormorant Garamond'",
    });

    expect(second).toBe(first);
  });

  it("returns empty output when canvas context is unavailable", () => {
    const originalCreateElement = document.createElement.bind(document);

    jest
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === "canvas") {
          const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
          Object.defineProperty(canvas, "getContext", {
            configurable: true,
            value: jest.fn(() => null),
          });
          return canvas;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as typeof document.createElement);

    const sampled = sampleTextPixels({
      text: "Carina",
      font: "500 64px 'Cormorant Garamond'",
    });

    expect(sampled.points).toEqual([]);
    expect(sampled.width).toBe(0);
    expect(sampled.height).toBe(0);
  });

  it("samples wrapped lines when maxWidth is constrained", () => {
    const ctx = makeContext(8);
    ctx.measureText = jest.fn((text: string) => ({ width: Math.max(1, text.length * 7) }));
    const originalCreateElement = document.createElement.bind(document);

    jest
      .spyOn(document, "createElement")
      .mockImplementation(((tagName: string) => {
        if (tagName.toLowerCase() === "canvas") {
          const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
          Object.defineProperty(canvas, "getContext", {
            configurable: true,
            value: jest.fn(() => ctx),
          });
          return canvas;
        }
        return originalCreateElement(tagName as keyof HTMLElementTagNameMap);
      }) as typeof document.createElement);

    const sampled = sampleTextPixels({
      text: "Un solo dettaglio",
      font: "400 20px 'DM Sans'",
      maxWidthPx: 56,
      lineHeightPx: 24,
      padding: 0,
      sampleStep: 2,
    });

    expect(sampled.width).toBe(56);
    expect(sampled.height).toBeGreaterThan(24);
    expect(ctx.fillText.mock.calls.length).toBeGreaterThan(1);
  });
});
