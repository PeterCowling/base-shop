import {
  boundedReadSize,
  bpsFromRatio,
  clamp01Vec3,
  fitPerspectiveDistance,
  isZScoreOutlier,
  minDistanceCull,
  rateToBps,
  rollingZScore,
  safeDivideRound,
  screenMarginCull,
  shortestEdge,
  stddevOrZero,
  toCents,
  toPositiveInt,
  toWholeCount,
  validateMinImageEdge,
} from "../index.js";

describe("math ops", () => {
  describe("units", () => {
    it("converts counts/cents and rounds safely", () => {
      expect(toWholeCount(10.6)).toBe(11);
      expect(toWholeCount(null)).toBeNull();
      expect(toCents(12.345)).toBe(1235);
      expect(toCents(undefined)).toBeNull();
    });

    it("converts rates to bps with detected scale", () => {
      expect(rateToBps(0.025)).toEqual({ bps: 250, scale: "ratio" });
      expect(rateToBps(2.5)).toEqual({ bps: 250, scale: "percent" });
      expect(rateToBps(250)).toEqual({ bps: 250, scale: "bps" });
      expect(rateToBps(null)).toBeNull();
      expect(bpsFromRatio(0.03)).toBe(300);
    });

    it("supports safe rounded division and positive int parsing", () => {
      expect(safeDivideRound(7, 3)).toBe(2);
      expect(safeDivideRound(7, 0)).toBeNull();
      expect(toPositiveInt("42.9", 10)).toBe(42);
      expect(toPositiveInt("oops", 10)).toBe(10);
      expect(toPositiveInt(0, 10, 1)).toBe(10);
    });
  });

  describe("spatial3d", () => {
    it("clamps vec3 components into [0, 1]", () => {
      expect(clamp01Vec3({ x: -2, y: 0.4, z: 3 })).toEqual({
        x: 0,
        y: 0.4,
        z: 1,
      });
      expect(clamp01Vec3({}, 0.75)).toEqual({ x: 0.75, y: 0.75, z: 0.75 });
    });

    it("computes perspective fit distances and culling predicates", () => {
      const distance = fitPerspectiveDistance({
        width: 2,
        height: 1,
        fovDegrees: 60,
        aspectRatio: 1.5,
      });
      expect(distance).toBeGreaterThan(0);
      expect(screenMarginCull(0.95, 0, 0.1)).toBe(true);
      expect(screenMarginCull(0.2, 0.3, 0.1)).toBe(false);
      expect(minDistanceCull(3, 4, 6)).toBe(true);
      expect(minDistanceCull(3, 4, 5)).toBe(false);
    });
  });

  describe("media constraints", () => {
    it("bounds reads and validates shortest edge", () => {
      expect(boundedReadSize(10_000, 5000)).toBe(5000);
      expect(boundedReadSize(10_000, -1)).toBe(0);
      expect(shortestEdge(1920, 1080)).toBe(1080);
      expect(validateMinImageEdge(1920, 1080, 1000)).toBe(true);
      expect(validateMinImageEdge(800, 600, 700)).toBe(false);
    });
  });

  describe("robust stats", () => {
    it("calculates z-score based outlier detection", () => {
      const window = [10, 11, 9, 10, 12, 8, 10];
      expect(stddevOrZero(window)).toBeGreaterThan(0);
      expect(rollingZScore(10, window)).not.toBeNull();
      expect(isZScoreOutlier(30, window, 2)).toBe(true);
      expect(isZScoreOutlier(10, window, 2)).toBe(false);
      expect(stddevOrZero([])).toBe(0);
      expect(rollingZScore(10, [])).toBeNull();
    });
  });
});
