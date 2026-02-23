import { createParticleEngine } from "./particleEngine";

function advance(engine: ReturnType<typeof createParticleEngine>, totalMs: number) {
  let remaining = totalMs;
  while (remaining > 0) {
    const step = Math.min(64, remaining);
    engine.tick(step);
    remaining -= step;
  }
}

describe("BrandMark particle engine", () => {
  it("advances through phases deterministically and lands on target points", () => {
    const engine = createParticleEngine({
      particleCount: 4,
      sourcePoints: [
        { x: 20, y: 20 },
        { x: 24, y: 18 },
      ],
      targetPoints: [
        { x: 80, y: 140 },
        { x: 84, y: 142 },
      ],
      seed: 42,
      baselineY: 100,
      neckX: 64,
      dissolveEndMs: 100,
      funnelEndMs: 200,
      settleEndMs: 300,
      completeMs: 400,
    });

    expect(engine.state.phase).toBe("dissolving");

    advance(engine, 120);
    expect(engine.state.phase).toBe("funneling");

    advance(engine, 120);
    expect(engine.state.phase).toBe("settling");

    advance(engine, 200);
    expect(engine.state.phase).toBe("done");
    expect(engine.state.settledCount).toBe(4);

    expect(engine.state.x[0]).toBeCloseTo(engine.state.tx[0], 5);
    expect(engine.state.y[0]).toBeCloseTo(engine.state.ty[0], 5);
  });

  it("handles zero particles without throwing", () => {
    const engine = createParticleEngine({
      particleCount: 0,
      sourcePoints: [{ x: 0, y: 0 }],
      targetPoints: [{ x: 10, y: 10 }],
    });

    expect(() => engine.tick(16)).not.toThrow();
    expect(engine.state.particleCount).toBe(0);
    expect(engine.state.settledCount).toBe(0);
  });

  it("falls back to source points when target points are empty", () => {
    const engine = createParticleEngine({
      particleCount: 2,
      sourcePoints: [
        { x: 10, y: 15 },
        { x: 12, y: 16 },
      ],
      targetPoints: [],
      seed: 7,
      dissolveEndMs: 20,
      funnelEndMs: 40,
      settleEndMs: 60,
      completeMs: 80,
    });

    advance(engine, 120);

    expect(engine.state.phase).toBe("done");
    expect(engine.state.x[0]).toBeCloseTo(engine.state.tx[0], 5);
    expect(engine.state.y[0]).toBeCloseTo(engine.state.ty[0], 5);
  });

  it("keeps particles in a single center stream during funneling in split mode", () => {
    const engine = createParticleEngine({
      particleCount: 2,
      sourcePoints: [
        { x: 44, y: 50 },
        { x: 56, y: 50 },
      ],
      targetPoints: [
        { x: 20, y: 60 },
        { x: 80, y: 60 },
      ],
      seed: 17,
      sourceJitterPx: 0,
      gravity: 0,
      damping: 1,
      attractorStrength: 0,
      funnelStrength: 3.2,
      baselineY: 70,
      neckX: 50,
      neckHalfWidth: 10,
      neckMode: "split",
      dissolveEndMs: 0,
      funnelEndMs: 200,
      settleEndMs: 300,
      completeMs: 400,
    });

    engine.state.vx[0] = 0;
    engine.state.vx[1] = 0;
    engine.state.vy[0] = 0;
    engine.state.vy[1] = 0;
    engine.state.active[0] = 1;
    engine.state.active[1] = 1;
    engine.state.releaseMs[0] = 0;
    engine.state.releaseMs[1] = 0;

    const initialLeftDistance = Math.abs(engine.state.x[0] - 50);
    const initialRightDistance = Math.abs(engine.state.x[1] - 50);

    advance(engine, 16);

    expect(engine.state.phase).toBe("funneling");
    expect(engine.state.active[0]).toBe(1);
    expect(engine.state.active[1]).toBe(1);
    expect(Math.abs(engine.state.x[0] - 50)).toBeLessThan(initialLeftDistance);
    expect(Math.abs(engine.state.x[1] - 50)).toBeLessThan(initialRightDistance);
    expect(engine.state.vx[0]).toBeGreaterThan(0);
    expect(engine.state.vx[1]).toBeLessThan(0);
  });
});
