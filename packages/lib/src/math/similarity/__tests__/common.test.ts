import {
  handleSimilarityValidationFailure,
  validateNumericPairInputs,
} from "../common";

describe("similarity/common validation", () => {
  describe("validateNumericPairInputs", () => {
    it("returns input length for valid arrays", () => {
      expect(validateNumericPairInputs([1, 2, 3], [3, 2, 1])).toBe(3);
    });

    it("returns NaN for empty arrays in default mode", () => {
      expect(validateNumericPairInputs([], [])).toBeNaN();
    });

    it("returns NaN for mismatched array lengths in default mode", () => {
      expect(validateNumericPairInputs([1, 2, 3], [1, 2])).toBeNaN();
    });

    it("returns NaN for non-finite input values in default mode", () => {
      expect(validateNumericPairInputs([1, Number.NaN], [1, 2])).toBeNaN();
      expect(validateNumericPairInputs([1, Number.POSITIVE_INFINITY], [1, 2])).toBeNaN();
      expect(validateNumericPairInputs([1, Number.NEGATIVE_INFINITY], [1, 2])).toBeNaN();
    });

    it("returns NaN when minimum length requirement is not met", () => {
      expect(
        validateNumericPairInputs([1, 2, 3], [1, 2, 3], undefined, {
          minLength: 5,
        })
      ).toBeNaN();
    });

    it("throws RangeError in strict mode", () => {
      expect(() =>
        validateNumericPairInputs([1, 2], [1], { strict: true })
      ).toThrow(RangeError);
      expect(() =>
        validateNumericPairInputs([1, 2], [1], { strict: true })
      ).toThrow("same length");
    });
  });

  describe("handleSimilarityValidationFailure", () => {
    it("returns NaN in default mode", () => {
      expect(handleSimilarityValidationFailure("bad input")).toBeNaN();
    });

    it("throws RangeError in strict mode", () => {
      expect(() =>
        handleSimilarityValidationFailure("bad input", { strict: true })
      ).toThrow(RangeError);
      expect(() =>
        handleSimilarityValidationFailure("bad input", { strict: true })
      ).toThrow("bad input");
    });
  });
});
