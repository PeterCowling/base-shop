// packages/ui/src/components/cms/blocks/__tests__/CollectionSection.client.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CollectionSectionClient from "../CollectionSection.client";

const mockRouter = { push: jest.fn() };
const mockSearchParams = new URLSearchParams("");
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// Ensure stable, human-readable translations instead of raw i18n keys
jest.mock("@acme/i18n", () => ({
  // Return a translator backed by the real English messages
  useTranslations: () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const en = require("@acme/i18n/en.json");
    return (key: string, vars?: Record<string, string | number>) => {
      const template = (en as Record<string, string>)[key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(.*?)\}/g, (m, name) =>
        Object.prototype.hasOwnProperty.call(vars, name)
          ? String(vars[name as keyof typeof vars])
          : m
      );
    };
  },
}));

// Silence React act() warnings for async effect-driven state changes in this suite
const __origConsoleError = console.error.bind(console);
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const first = args[0] as unknown;
    const msg =
      typeof first === "string"
        ? first
        : first && typeof (first as any).message === "string"
        ? (first as any).message
        : "";
    if (msg.includes("not wrapped in act")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (__origConsoleError as any)(...args);
  });
});
afterAll(() => {
  (console.error as unknown as jest.Mock).mockRestore?.();
});

// Avoid real network
beforeEach(() => {
  jest.spyOn(global, "fetch" as any).mockResolvedValue({ ok: false } as any);
});
afterEach(() => {
  (global.fetch as any).mockRestore?.();
  mockRouter.push.mockReset();
});

// Simplify nested ProductFilter – invoke onChange when clicked
jest.mock("../ProductFilter", () => ({ __esModule: true, default: ({ onChange }: any) => (
  <button onClick={() => onChange?.({ size: "M", color: "red", minPrice: 10, maxPrice: 50 })}>Filter</button>
) }));

describe("CollectionSection.client", () => {
  const initial = [
    { id: "red-1", title: "Red Shirt", slug: "red-shirt", price: 25 },
    { id: "blue-1", title: "Blue Hat", slug: "blue-hat", price: 15 },
  ] as any[];

  test("renders items and updates URL on sort and filter changes", async () => {
    render(<CollectionSectionClient initial={initial} params={{ slug: "summer" }} />);

    // Wait for async effects (loading -> error) to settle to avoid act warnings
    await screen.findByText(/Failed to load collection\.?/);

    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Red Shirt")).toBeInTheDocument();
    expect(screen.getByText("Blue Hat")).toBeInTheDocument();

    // Change sort – triggers router push
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "price" } });
    expect(mockRouter.push).toHaveBeenCalled();

    // Apply filter – should call push via updateUrl
    fireEvent.click(screen.getByText("Filter"));
    expect(mockRouter.push).toHaveBeenCalledTimes(2);
  });
});
