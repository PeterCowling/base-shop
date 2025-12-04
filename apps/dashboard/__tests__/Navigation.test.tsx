import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));
jest.mock("../src/pages/Upgrade", () => ({
  __esModule: true,
  default: () => <div>UpgradeStub</div>,
}));

const { useRouter } = require("next/router");
const originalFetch = global.fetch;
let consoleErrorSpy: jest.SpyInstance;

describe("Dashboard navigation surfaces", () => {
  beforeEach(() => {
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/dashboard/shops")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: "shop1", name: "Shop One", status: "ready", pending: 2 },
            { id: "shop2", name: "Shop Two", status: "up_to_date", pending: 0 },
            { id: "shop3", name: "Shop Three", status: "failed", pending: 1 },
          ],
        }) as any;
      }
      if (url.includes("/api/dashboard/shop/") && url.includes("upgrade-history")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: "job-1",
              status: "success",
              timestamp: "2025-01-01T00:00:00Z",
              components: ["header"],
              user: "tester",
            },
          ],
        }) as any;
      }
      if (url.includes("/upgrade-history")) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: "job-1",
              status: "success",
              timestamp: "2025-01-01T00:00:00Z",
              components: [],
            },
          ],
        }) as any;
      }
      if (url.includes("/api/shop/") && url.includes("/component-diff")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            core: [
              { file: "CompA.tsx", componentName: "CompA", newChecksum: "1" },
            ],
          }),
        }) as any;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      }) as any;
    });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ query: {} });
  });

  it("renders dashboard stub content", () => {
    const Dashboard = require("../src/pages/dashboard").default;
    render(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(/Pipeline overview coming soon/i)
    ).toBeInTheDocument();
  });

  it("renders shops list and filters by search", async () => {
    const Shops = require("../src/pages/shops").default;
    render(<Shops />);
    await screen.findByText("Shops");
    const input = screen.getByPlaceholderText(/Search by name, id, or region/i);
    const user = userEvent.setup();
    await user.clear(input);
    await user.type(input, "shop3");
    await screen.findByText(/Shop Three/i);
  });

  it("renders workboard lanes", async () => {
    const Workboard = require("../src/pages/workboard").default;
    render(<Workboard />);
    await screen.findByText("Workboard");
    await screen.findByText("Needs review");
    await screen.findByText(/Shop One/i);
  });

  it("renders history timeline stub", async () => {
    const History = require("../src/pages/history").default;
    render(<History />);
    await screen.findByText("Release history");
    await screen.findByText(/Cross-shop publish history/i);
    await screen.findByText(/shop1/i);
  });

  it("renders shop detail wrapper with diff tab", async () => {
    (useRouter as jest.Mock).mockReturnValue({ query: { id: "shop1" } });
    const ShopDetail = require("../src/pages/shops/[id]").default;
    render(<ShopDetail />);
    expect(screen.getByText(/Shop shop1/i)).toBeInTheDocument();
    expect(screen.getByText("Diff")).toBeInTheDocument();
    const historyTab = screen.getByText("History");
    await userEvent.click(historyTab);
    await screen.findByText(/job-1/i);
  });
});
