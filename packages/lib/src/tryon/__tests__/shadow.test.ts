import { renderShadow } from "../fallback/shadow";

describe("renderShadow", () => {
  it("draws an elliptical shadow with the configured options", () => {
    const gradient = { addColorStop: jest.fn() };
    const ctx = {
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      ellipse: jest.fn(),
      fill: jest.fn(),
      createRadialGradient: jest.fn(() => gradient),
      globalCompositeOperation: "source-over",
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;

    renderShadow(
      ctx,
      { x: 10, y: 20, width: 100, height: 40 },
      { opacity: 0.5, scale: 1.5, angleDeg: 45 }
    );

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
    expect(gradient.addColorStop).toHaveBeenCalledWith(0, "rgba(0,0,0,0.5)");
    expect(gradient.addColorStop).toHaveBeenCalledWith(1, "rgba(0,0,0,0)");

    const call = (ctx.createRadialGradient as jest.Mock).mock.calls[0];
    expect(call[0]).toBeCloseTo(68.75, 2);
    expect(call[1]).toBeCloseTo(61.53, 2);
    expect(call[2]).toBeCloseTo(2.16, 2);
    expect(call[3]).toBeCloseTo(68.75, 2);
    expect(call[4]).toBeCloseTo(61.53, 2);
    expect(call[5]).toBeCloseTo(82.5, 2);

    const ellipseCall = (ctx.ellipse as jest.Mock).mock.calls[0];
    expect(ellipseCall[0]).toBeCloseTo(68.75, 2);
    expect(ellipseCall[1]).toBeCloseTo(61.53, 2);
    expect(ellipseCall[2]).toBeCloseTo(82.5, 2);
    expect(ellipseCall[3]).toBeCloseTo(10.8, 2);
    expect(ellipseCall[4]).toBe(0);
    expect(ellipseCall[5]).toBe(0);
    expect(ellipseCall[6]).toBeCloseTo(Math.PI * 2, 5);

    expect((ctx as any).globalCompositeOperation).toBe("multiply");
    expect((ctx as any).fillStyle).toBe(gradient);
  });
});
