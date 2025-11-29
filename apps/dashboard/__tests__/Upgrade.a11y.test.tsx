import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

const { useRouter } = require("next/router");

describe("Upgrade page accessibility (color-contrast)", () => {
  const originalFetch = global.fetch;
  let Upgrade: typeof import("../src/pages/Upgrade").default;

  beforeEach(async () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { id: "shop1" } });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        core: [
          { file: "CompA.tsx", componentName: "CompA" },
          { file: "CompB.tsx", componentName: "CompB" },
        ],
      }),
    });
    ({ default: Upgrade } = await import("../src/pages/Upgrade"));
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
    global.fetch = originalFetch;
  });

  it("renders with no color-contrast violations", async () => {
    const { container } = render(<Upgrade />);

    // Ensure content is present before running axe
    await screen.findByText("core");

    const results = await axe(container, {
      runOnly: { type: "rule", values: ["color-contrast"] },
    });
    expect(results).toHaveNoViolations();
  });
});
