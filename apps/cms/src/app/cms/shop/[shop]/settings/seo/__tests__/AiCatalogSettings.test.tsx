import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import AiCatalogSettings from "../AiCatalogSettings";

expect.extend(toHaveNoViolations as any);

const updateAiCatalog = jest.fn();
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  update: jest.fn(),
  promise: async <T,>(value: Promise<T>) => value,
};

jest.mock("@cms/actions/shops.server", () => ({
  updateAiCatalog: (...args: any[]) => updateAiCatalog(...args),
}));
jest.mock("@acme/ui/operations", () => ({
  __esModule: true,
  useToast: () => mockToast,
}));
jest.mock("@/lib/datetime", () => ({
  formatTimestamp: (value: string) => `formatted-${value}`,
}));
jest.mock("@/components/atoms", () => ({
  Tooltip: ({ children }: any) => <span>{children}</span>,
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Checkbox: ({ onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    ),
    Input: ({ name, "aria-label": ariaLabel, ...props }: any) => (
      <input aria-label={ariaLabel ?? name} name={name} {...props} />
    ),
  }),
  { virtual: true },
);

describe("AiCatalogSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as unknown) = jest.fn().mockResolvedValue({
      json: async () => ({ items: [] }),
    });
  });

  const initial = {
    enabled: true,
    fields: ["id", "title", "description"] as ("title" | "description" | "id" | "media" | "price")[],
    pageSize: 20,
    lastCrawl: "2025-01-01T00:00:00Z",
  };

  it("submits updates, surfaces validation feedback, and meets accessibility expectations", async () => {
    updateAiCatalog.mockResolvedValue({
      errors: { pageSize: ["Too small"] },
    });

    const { container } = render(<AiCatalogSettings shop="lux" initial={initial} />);

    const titleCheckbox = screen.getByLabelText(/title/i);
    await userEvent.click(titleCheckbox);
    await userEvent.clear(screen.getByLabelText(/page size/i));
    await userEvent.type(screen.getByLabelText(/page size/i), "15");
    await userEvent.click(screen.getByRole("button", { name: /save settings/i }));

    expect(updateAiCatalog).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Too small")).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).not.toBeChecked();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("queues crawls and previews feeds via toast notifications", async () => {
    render(<AiCatalogSettings shop="lux" initial={initial} />);

    const queueButton = screen.getByRole("button", { name: /queue crawl/i });
    await userEvent.click(queueButton);
    expect(queueButton).toBeDisabled();
    await waitFor(() =>
      expect(mockToast.success).toHaveBeenCalledWith("AI catalog crawl queued"),
    );

    await userEvent.click(screen.getByRole("button", { name: /view feed/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/seo/ai-catalog?shop=lux&limit=10"),
    );
  });

  it("applies server updates and disables quick actions when the feed is off", async () => {
    updateAiCatalog.mockResolvedValue({
      settings: {
        seo: {
          aiCatalog: { enabled: false, fields: ["id", "price"], pageSize: 5 },
        },
      },
    });

    render(<AiCatalogSettings shop="lux" initial={initial} />);

    await userEvent.clear(screen.getByLabelText(/page size/i));
    await userEvent.type(screen.getByLabelText(/page size/i), "5");
    await userEvent.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(updateAiCatalog).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /queue crawl/i })).toBeDisabled();
      expect(screen.getByLabelText(/price/i)).toBeChecked();
      expect(screen.getByLabelText(/title/i)).not.toBeChecked();
    });
  });
});
