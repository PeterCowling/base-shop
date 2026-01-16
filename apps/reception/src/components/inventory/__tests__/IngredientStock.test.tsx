// src/components/inventory/__tests__/IngredientStock.test.tsx
/* eslint-disable no-var */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// --------> change let ➜ var  (hoisted, avoids TDZ)
var useIngredientsMock: ReturnType<typeof vi.fn>;

vi.mock("../../../hooks/data/inventory/useIngredients", () => {
  useIngredientsMock = vi.fn();
  return { default: useIngredientsMock };
});

import IngredientStock from "../IngredientStock";

describe("IngredientStock", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useIngredientsMock.mockReset();
  });

  it("shows loading state", () => {
    useIngredientsMock.mockReturnValue({
      ingredients: {},
      loading: true,
      error: null,
      updateIngredient: vi.fn(),
    });

    render(<IngredientStock />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    useIngredientsMock.mockReturnValue({
      ingredients: {},
      loading: false,
      error: new Error("fail"),
      updateIngredient: vi.fn(),
    });

    render(<IngredientStock />);
    expect(screen.getByText("Error loading inventory")).toBeInTheDocument();
  });

  it("updates ingredient when saved", async () => {
    const updateMock = vi.fn();
    useIngredientsMock.mockReturnValue({
      ingredients: {
        Flour: { name: "Flour", quantity: 10 },
        Sugar: { name: "Sugar", quantity: 5 },
      },
      loading: false,
      error: null,
      updateIngredient: updateMock,
    });

    render(<IngredientStock />);

    const input = screen.getAllByRole("spinbutton")[0];
    await userEvent.clear(input);
    await userEvent.type(input, "15");

    const saveBtn = screen.getAllByRole("button", { name: /save/i })[0];
    await userEvent.click(saveBtn);

    expect(updateMock).toHaveBeenCalledWith("Flour", 15);
  });

  it("applies dark mode classes", () => {
    useIngredientsMock.mockReturnValue({
      ingredients: {},
      loading: false,
      error: null,
      updateIngredient: vi.fn(),
    });

    render(
      <div className="dark">
        <IngredientStock />
      </div>
    );

    const heading = screen.getByRole("heading", { name: /ingredient stock/i });
    expect(heading.parentElement).toHaveClass("dark:bg-darkBg");
  });
});
