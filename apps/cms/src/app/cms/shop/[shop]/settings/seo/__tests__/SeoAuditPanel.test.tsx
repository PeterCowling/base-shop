import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import SeoAuditPanel from "../SeoAuditPanel";

expect.extend(toHaveNoViolations as any);

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  (global as any).fetch = fetchMock;
});

afterAll(() => {
  (global as any).fetch = originalFetch;
});

jest.mock("@acme/date-utils", () => ({
  formatTimestamp: (value: string) => `formatted-${value}`,
}));
jest.mock(
  "@/components/atoms",
  () => ({
    Skeleton: (props: any) => <div {...props} />,
    Toast: ({ open, message }: any) =>
      open ? (
        <div role="status" aria-live="polite">
          {message}
        </div>
      ) : null,
    Tooltip: ({ children }: any) => <span>{children}</span>,
  }),
  { virtual: true },
);
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
    TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
    TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
    TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
    TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
    TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  }),
  { virtual: true },
);

describe("SeoAuditPanel", () => {
  it("loads history, runs audits, and announces toast states", async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: async () => [
          {
            timestamp: "2025-01-01T00:00:00Z",
            score: 0.9,
            issues: 3,
            recommendations: ["Optimize alt text"],
          },
        ],
      })
      .mockResolvedValueOnce({
        json: async () => ({
          timestamp: "2025-02-01T00:00:00Z",
          score: 0.95,
          issues: 1,
        }),
      })
      .mockRejectedValueOnce(new Error("network"));

    const { container } = render(<SeoAuditPanel shop="lux" />);

    const initialTimestamps = await screen.findAllByText(
      "formatted-2025-01-01T00:00:00Z",
    );
    expect(initialTimestamps.length).toBeGreaterThan(0);

    const results = await axe(container);
    expect(results).toHaveNoViolations();

    await userEvent.click(screen.getByRole("button", { name: /run audit/i }));
    expect(await screen.findByRole("status")).toHaveTextContent("Audit completed");
    expect(
      screen.getAllByText("formatted-2025-02-01T00:00:00Z").length,
    ).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith("/api/seo/audit/lux", { method: "POST" });

    await userEvent.click(screen.getByRole("button", { name: /run audit/i }));
    expect(await screen.findByRole("status")).toHaveTextContent("Audit failed");
  });
});
