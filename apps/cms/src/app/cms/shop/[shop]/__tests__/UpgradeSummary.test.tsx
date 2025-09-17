// React 19 requires this flag to silence act warnings in tests
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { render, screen } from "@testing-library/react";
import UpgradeSummary from "@/app/cms/shop/[shop]/UpgradeSummary";

describe("UpgradeSummary", () => {
  const shop = "demo-shop";
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    const mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("renders upgrade rows in a DataTable", async () => {
    const components = [
      {
        name: "@acme/ui",
        from: "1.0.0",
        to: "1.1.0",
        changelog: "https://example.com/ui",
      },
      {
        name: "@acme/theme",
        from: null,
        to: "2.0.0",
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ components }),
    });

    const view = await UpgradeSummary({ shop });
    render(view);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Package" })
    ).toBeInTheDocument();
    components.forEach((component) => {
      expect(screen.getByText(component.name)).toBeInTheDocument();
      expect(screen.getByText(component.to)).toBeInTheDocument();
    });

    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getAllByText("—")).not.toHaveLength(0);

    expect(
      screen.getByRole("link", { name: /view/i })
    ).toHaveAttribute("href", components[0].changelog);
  });

  it("renders an empty state when there are no upgrades", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ components: [] }),
    });

    const view = await UpgradeSummary({ shop });
    render(view);

    expect(
      screen.getByText("No component upgrades found.")
    ).toBeInTheDocument();
  });

  it("shows an error message when the upgrade request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const view = await UpgradeSummary({ shop });
    render(view);

    expect(
      screen.getByText("Failed to load upgrade information.")
    ).toBeInTheDocument();
  });
});

