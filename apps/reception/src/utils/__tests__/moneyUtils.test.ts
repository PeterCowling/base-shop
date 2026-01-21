
import "@testing-library/jest-dom";
import { roundDownTo50Cents } from "../moneyUtils";

describe("roundDownTo50Cents", () => {
  it("rounds values down to nearest half", () => {
    expect(roundDownTo50Cents(10.99)).toBe(10.5);
    expect(roundDownTo50Cents(10.5)).toBe(10.5);
    expect(roundDownTo50Cents(10.25)).toBe(10);
  });
});
