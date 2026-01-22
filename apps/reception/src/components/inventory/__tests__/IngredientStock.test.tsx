// src/components/inventory/__tests__/IngredientStock.test.tsx
/* eslint-disable no-var */
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import IngredientStock from "../IngredientStock";

// --------> change let ➜ var  (hoisted, avoids TDZ)
var useIngredientsMock: jest.Mock;

jest.mock("../../../hooks/data/inventory/useIngredients", () => {
  useIngredientsMock = jest.fn();
  return { default: useIngredientsMock };
});

describe("IngredientStock", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    useIngredientsMock.mockReset();
  });

  it("shows loading state", () => {
    useIngredientsMock.mockReturnValue({
      ingredients: {},
      loading: true,
      error: null,
      updateIngredient: jest.fn(),
    });

    render(<IngredientStock />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    useIngredientsMock.mockReturnValue({
      ingredients: {},
      loading: false,
      error: new Error("fail"),
      updateIngredient: jest.fn(),
    });

    render(<IngredientStock />);
    expect(screen.getByText("Error loading inventory")).toBeInTheDocument();
  });

  it("updates ingredient when saved", async () => {
    const updateMock = jest.fn();
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
      updateIngredient: jest.fn(),
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
