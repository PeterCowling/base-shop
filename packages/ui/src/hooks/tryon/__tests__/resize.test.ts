import { resizeImageToMaxPx } from "../resize";

describe("resizeImageToMaxPx", () => {
  const originalCreateImageBitmap = global.createImageBitmap;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    originalCreateElement = document.createElement;
  });

  afterEach(() => {
    (global as any).createImageBitmap = originalCreateImageBitmap;
    document.createElement = originalCreateElement;
    jest.restoreAllMocks();
  });

  function setupCanvas(overrides: Partial<HTMLCanvasElement> = {}) {
    const ctx = { drawImage: jest.fn() } as unknown as CanvasRenderingContext2D;
    const canvas: Partial<HTMLCanvasElement> = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(ctx),
      toBlob: jest.fn((cb: BlobCallback) => cb(new Blob(["x"], { type: "image/png" }))),
      ...overrides,
    };
    jest.spyOn(document, "createElement").mockReturnValue(canvas as HTMLCanvasElement);
    return { canvas, ctx };
  }

  it("returns original dimensions when within bounds", async () => {
    const bitmap = { width: 800, height: 600 };
    (global as any).createImageBitmap = jest.fn().mockResolvedValue(bitmap);
    const { canvas, ctx } = setupCanvas();
    const file = new File(["data"], "photo.png", { type: "image/png" });

    const result = await resizeImageToMaxPx(file, 1600);

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.blob.type).toBe("image/png");
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(ctx.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 800, 600);
  });

  it("scales down wide images to the max width", async () => {
    const bitmap = { width: 2000, height: 1000 };
    (global as any).createImageBitmap = jest.fn().mockResolvedValue(bitmap);
    const { canvas } = setupCanvas();
    const file = new File(["data"], "wide.jpg", { type: "image/jpeg" });

    const result = await resizeImageToMaxPx(file, 1600);

    expect(result.width).toBe(1600);
    expect(result.height).toBe(800);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(800);
  });

  it("scales down tall images to the max height", async () => {
    const bitmap = { width: 1000, height: 2000 };
    (global as any).createImageBitmap = jest.fn().mockResolvedValue(bitmap);
    const { canvas } = setupCanvas();
    const file = new File(["data"], "tall.webp", { type: "image/webp" });

    const result = await resizeImageToMaxPx(file, 1600);

    expect(result.width).toBe(800);
    expect(result.height).toBe(1600);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(1600);
  });

  it("throws when the canvas context cannot be created", async () => {
    const bitmap = { width: 500, height: 400 };
    (global as any).createImageBitmap = jest.fn().mockResolvedValue(bitmap);
    jest
      .spyOn(document, "createElement")
      .mockReturnValue({
        width: 0,
        height: 0,
        getContext: () => null,
        toBlob: jest.fn(),
      } as unknown as HTMLCanvasElement);
    const file = new File(["data"], "broken.png", { type: "image/png" });

    await expect(resizeImageToMaxPx(file)).rejects.toThrow("Canvas 2D not supported");
  });

  it("rejects when encoding fails", async () => {
    const bitmap = { width: 400, height: 400 };
    (global as any).createImageBitmap = jest.fn().mockResolvedValue(bitmap);
    jest
      .spyOn(document, "createElement")
      .mockReturnValue({
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: jest.fn() }),
        toBlob: (cb: BlobCallback) => cb(null),
      } as unknown as HTMLCanvasElement);
    const file = new File(["data"], "fail.png", { type: "image/png" });

    await expect(resizeImageToMaxPx(file)).rejects.toThrow("Failed to encode image");
  });
});
