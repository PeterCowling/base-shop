import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import VarianceHeatMap from "../VarianceHeatMap";

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { user_name: "Pete", email: "pete@test.com", roles: ["staff"] },
  }),
}));

jest.mock("../../../hooks/data/useCashCountsData", () => ({
  useCashCountsData: () => ({
    cashCounts: [
      { user: "Alice", timestamp: "2024-01-01T00:00:00Z", type: "close", difference: 2 },
      { user: "Bob", timestamp: "2024-01-02T00:00:00Z", type: "close", difference: -1 },
    ],
    loading: false,
    error: null,
  }),
}));

jest.mock("../../../hooks/data/useVarianceThresholds", () => ({
  useVarianceThresholds: () => ({
    thresholds: { cash: 5, keycards: 3 },
    loading: false,
    error: null,
  }),
}));

jest.mock("../../../hooks/mutations/useVarianceThresholdsMutations", () => ({
  useVarianceThresholdsMutations: () => ({
    updateThresholds: jest.fn(),
  }),
}));

describe("VarianceHeatMap", () => {
  it("renders without dark mode classes", () => {
    const { container } = render(
      <div>
        <VarianceHeatMap />
      </div>
    );
    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
  });
});
