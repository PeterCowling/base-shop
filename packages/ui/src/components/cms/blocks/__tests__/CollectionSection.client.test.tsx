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

  test("renders items and updates URL on sort and filter changes", () => {
    render(<CollectionSectionClient initial={initial} params={{ slug: "summer" }} />);

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

