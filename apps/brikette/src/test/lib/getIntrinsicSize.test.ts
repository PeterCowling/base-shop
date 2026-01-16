import { beforeEach, describe, expect, it, vi } from "vitest";

const accessSpy = vi.fn();

vi.mock("@/data/imageDimensions.json", () => {
  const manifest = new Proxy(
    {
      "/hero.jpg": { width: 800, height: 600 },
    },
    {
      get(target, prop) {
        accessSpy(String(prop));
        return (target as any)[prop as keyof typeof target];
      },
    },
  );

  return { __esModule: true, default: manifest, accessSpy };
});

let getIntrinsicSize: typeof import("@/lib/getIntrinsicSize").getIntrinsicSize;

beforeEach(async () => {
  vi.resetModules();
  accessSpy.mockClear();
  ({ getIntrinsicSize } = await import("@/lib/getIntrinsicSize"));
});

describe("getIntrinsicSize", () => {
  it("looks up dimensions from the manifest", () => {
    expect(getIntrinsicSize("/hero.jpg")).toEqual({ width: 800, height: 600 });
    expect(accessSpy).toHaveBeenCalledWith("/hero.jpg");
  });

  it("returns cached values on repeated calls", () => {
    expect(getIntrinsicSize("/hero.jpg")).toBeDefined();
    expect(accessSpy).toHaveBeenCalledTimes(1);

    getIntrinsicSize("/hero.jpg");
    expect(accessSpy).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for unknown keys", () => {
    expect(getIntrinsicSize("/missing.png")).toBeUndefined();
  });
});