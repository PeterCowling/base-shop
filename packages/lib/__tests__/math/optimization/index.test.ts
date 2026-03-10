import {
  PortfolioModelValidationError,
  solveBinaryPortfolio,
} from "../../../src/math/optimization";

describe("solveBinaryPortfolio", () => {
  it("TC-02-04: chooses a deterministic winner when utilities tie", () => {
    const result = solveBinaryPortfolio({
      options: [
        { id: "b", utility: 10, coefficients: { capacity: 1 } },
        { id: "a", utility: 10, coefficients: { capacity: 1 } },
        { id: "c", utility: 9, coefficients: { capacity: 1 } },
      ],
      constraints: [{ key: "capacity", max: 1 }],
    });

    expect(result.status).toBe("optimal");
    expect(result.objective_value).toBe(10);
    expect(result.selected_option_ids).toEqual(["a"]);
    expect(result.option_values).toMatchObject({ a: 1 });
  });

  it("TC-02-05: returns infeasible without leaking a partial selection", () => {
    const result = solveBinaryPortfolio({
      options: [{ id: "a", utility: 4, coefficients: { capacity: 1 } }],
      constraints: [{ key: "capacity", min: 2 }],
    });

    expect(result.status).toBe("infeasible");
    expect(result.objective_value).toBeNull();
    expect(result.selected_option_ids).toEqual([]);
    expect(result.option_values).toEqual({});
  });

  it("TC-02-06: rejects unknown constraint coefficients", () => {
    expect(() =>
      solveBinaryPortfolio({
        options: [{ id: "a", utility: 4, coefficients: { risk: 1 } }],
        constraints: [{ key: "capacity", max: 1 }],
      }),
    ).toThrow(new PortfolioModelValidationError("unknown_constraint_key:risk"));
  });
});
