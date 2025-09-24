import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Chip } from "../src/components/atoms/Chip";

describe("Chip", () => {
  it("renders children and remove button triggers callback", () => {
    const onRemove = jest.fn();
    render(
      <Chip onRemove={onRemove} variant="success">
        Label
      </Chip>
    );
    expect(screen.getByText("Label")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onRemove).toHaveBeenCalled();
  });
});

