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
});
