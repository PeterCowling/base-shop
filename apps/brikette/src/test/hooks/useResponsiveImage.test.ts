import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react";

import { PRESETS } from "@/config/imagePresets";
import { useResponsiveImage } from "@/hooks/useResponsiveImage";
import type { BuildCfImageOptions } from "@/lib/buildCfImageUrl";

jest.mock("@/lib/buildCfImageUrl", () => {
  const buildCfImageUrl = (src: string, opts: BuildCfImageOptions) =>
    `${src}?width=${opts.width}&format=${opts.format}`;

  return {
    __esModule: true,
    buildCfImageUrl,
    default: buildCfImageUrl,
  };
});

jest.mock("@/lib/getIntrinsicSize", () => ({
  getIntrinsicSize: () => ({ width: 1920, height: 1080 }),
}));

describe("useResponsiveImage", () => {
  it("returns srcSet and intrinsic dimensions", () => {
    const { result } = renderHook(() =>
      useResponsiveImage({
        src: "/hero.jpg",
        preset: "hero",
        extra: { format: "webp" },
      }),
    );

    const expected = PRESETS.hero.map((w) => `/hero.jpg?width=${w}&format=webp ${w}w`).join(", ");
    expect(result.current.srcSet).toBe(expected);
    expect(result.current.sizes).toBe("100vw");
    expect(result.current.dims).toEqual({ width: 1920, height: 1080 });
  });

  it("supports explicit responsive entries and builds correct sizes string", () => {
    const { result } = renderHook(() =>
      useResponsiveImage({
        src: "/hero.jpg",
        responsive: [
          { breakpoint: 480, width: 480 },
          { breakpoint: 768, width: 768 },
        ],
        extra: { format: "webp" },
      }),
    );

    expect(result.current.srcSet).toContain("/hero.jpg?width=480&format=webp 480w");
    expect(result.current.srcSet).toContain("/hero.jpg?width=768&format=webp 768w");
    expect(result.current.sizes).toBe(
      "(max-width: 480px) 480px, (max-width: 768px) 768px, 100vw",
    );
  });
});