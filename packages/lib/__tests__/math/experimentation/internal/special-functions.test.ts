import {
  chiSquareSf,
  logBeta,
  logGamma,
  normalCdf,
  normalPpf,
  regularizedIncompleteBeta,
  regularizedIncompleteGamma,
  studentTCdf,
  studentTPpf,
} from "../../../../src/math/experimentation/internal/special-functions";

describe("experimentation/internal/special-functions", () => {
  describe("normal distribution", () => {
    test("TC-00-01: normalPpf(0.975) ~= 1.9599639845", () => {
      expect(normalPpf(0.975)).toBeCloseTo(1.9599639845, 6);
    });

    test("normalCdf(0) = 0.5", () => {
      expect(normalCdf(0)).toBeCloseTo(0.5, 12);
    });

    test("normalCdf is symmetric", () => {
      const x = 1.2;
      expect(normalCdf(x) + normalCdf(-x)).toBeCloseTo(1, 12);
    });

    test("normalPpf is inverse of normalCdf for common quantiles", () => {
      const probs = [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99];

      for (const p of probs) {
        const roundtrip = normalCdf(normalPpf(p));
        expect(roundtrip).toBeCloseTo(p, 8);
      }
    });

    test("normalPpf validates domain", () => {
      expect(() => normalPpf(0)).toThrow(RangeError);
      expect(() => normalPpf(1)).toThrow(RangeError);
      expect(() => normalPpf(-0.5)).toThrow(RangeError);
    });
  });

  describe("gamma and beta", () => {
    test("TC-00-04: logGamma(0.5) ~= 0.5723649429", () => {
      expect(logGamma(0.5)).toBeCloseTo(0.5723649429, 8);
    });

    test("logGamma(1) = 0", () => {
      expect(logGamma(1)).toBeCloseTo(0, 12);
    });

    test("logGamma(5) = ln(24)", () => {
      expect(logGamma(5)).toBeCloseTo(Math.log(24), 10);
    });

    test("logBeta(0.5, 0.5) = ln(pi)", () => {
      expect(logBeta(0.5, 0.5)).toBeCloseTo(Math.log(Math.PI), 10);
    });

    test("regularizedIncompleteGamma(1, x) = 1 - exp(-x)", () => {
      const x = 2.3;
      expect(regularizedIncompleteGamma(1, x)).toBeCloseTo(1 - Math.exp(-x), 10);
    });

    test("regularizedIncompleteGamma(2, x) = 1 - exp(-x)(x+1)", () => {
      const x = 2.3;
      expect(regularizedIncompleteGamma(2, x)).toBeCloseTo(
        1 - Math.exp(-x) * (x + 1),
        10
      );
    });

    test("regularizedIncompleteGamma handles x = 0", () => {
      expect(regularizedIncompleteGamma(3, 0)).toBe(0);
    });

    test("regularizedIncompleteGamma validates parameters", () => {
      expect(() => regularizedIncompleteGamma(0, 1)).toThrow(RangeError);
      expect(() => regularizedIncompleteGamma(1, -1)).toThrow(RangeError);
    });

    test("regularizedIncompleteBeta(1,1,x) = x", () => {
      const x = 0.37;
      expect(regularizedIncompleteBeta(x, 1, 1)).toBeCloseTo(x, 12);
    });

    test("regularizedIncompleteBeta symmetry identity", () => {
      const x = 0.31;
      const a = 2.5;
      const b = 5.1;
      const lhs = regularizedIncompleteBeta(x, a, b);
      const rhs = 1 - regularizedIncompleteBeta(1 - x, b, a);
      expect(lhs).toBeCloseTo(rhs, 10);
    });

    test("regularizedIncompleteBeta handles boundaries", () => {
      expect(regularizedIncompleteBeta(0, 2, 3)).toBe(0);
      expect(regularizedIncompleteBeta(1, 2, 3)).toBe(1);
    });

    test("regularizedIncompleteBeta validates parameters", () => {
      expect(() => regularizedIncompleteBeta(0.3, 0, 1)).toThrow(RangeError);
      expect(() => regularizedIncompleteBeta(0.3, 1, 0)).toThrow(RangeError);
      expect(() => regularizedIncompleteBeta(-0.1, 1, 1)).toThrow(RangeError);
      expect(() => regularizedIncompleteBeta(1.1, 1, 1)).toThrow(RangeError);
    });
  });

  describe("student-t and chi-square", () => {
    test("TC-00-02: studentTCdf(2.045, 29) ~= 0.975", () => {
      expect(studentTCdf(2.045, 29)).toBeCloseTo(0.975, 4);
    });

    test("studentTCdf symmetry around zero", () => {
      const t = 1.7;
      const df = 12;
      expect(studentTCdf(t, df) + studentTCdf(-t, df)).toBeCloseTo(1, 10);
    });

    test("studentTPpf inverts studentTCdf", () => {
      const probs = [0.025, 0.1, 0.5, 0.9, 0.975];
      const df = 29;

      for (const p of probs) {
        const roundtrip = studentTCdf(studentTPpf(p, df), df);
        expect(roundtrip).toBeCloseTo(p, 6);
      }
    });

    test("studentTPpf validates inputs", () => {
      expect(() => studentTPpf(0, 5)).toThrow(RangeError);
      expect(() => studentTPpf(1, 5)).toThrow(RangeError);
      expect(() => studentTPpf(0.5, 0)).toThrow(RangeError);
    });

    test("TC-00-03: chiSquareSf(10, 2) ~= 0.006737947", () => {
      expect(chiSquareSf(10, 2)).toBeCloseTo(0.006737947, 6);
    });

    test("chiSquareSf(0, df) = 1", () => {
      expect(chiSquareSf(0, 1)).toBeCloseTo(1, 12);
      expect(chiSquareSf(0, 10)).toBeCloseTo(1, 12);
    });

    test("chiSquareSf validates input", () => {
      expect(() => chiSquareSf(-1, 2)).toThrow(RangeError);
      expect(() => chiSquareSf(1, 0)).toThrow(RangeError);
    });
  });
});
