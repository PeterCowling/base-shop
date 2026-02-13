import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@acme/i18n", () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

jest.mock("../src/lib/telemetry", () => ({
  trackEvent: jest.fn(),
}));

const { useRouter } = require("next/router");

describe("Upgrade page accessibility (color-contrast)", () => {
  const originalFetch = global.fetch;
  let Upgrade: typeof import("../src/pages/Upgrade").default;

  beforeEach(async () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { id: "shop1" } });
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/shop/shop1/component-diff")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            core: [
              { file: "CompA.tsx", componentName: "CompA", newChecksum: "abc123" },
              { file: "CompB.tsx", componentName: "CompB", newChecksum: "def456" },
            ],
          }),
        }) as any;
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        text: async () => "Not found",
      }) as any;
    });
    ({ default: Upgrade } = await import("../src/pages/Upgrade"));
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
    global.fetch = originalFetch;
  });

  it("renders with no color-contrast violations", async () => {
    // Suppress expected console.error from "We couldn't load the latest upgrade preview"
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(<Upgrade />);

    // Ensure content is present before running axe (longer timeout for CI)
    await screen.findByText("core", {}, { timeout: 5000 });

    const results = await axe(container, {
      runOnly: { type: "rule", values: ["color-contrast"] },
    });
    expect(results).toHaveNoViolations();

    errorSpy.mockRestore();
  });
});
