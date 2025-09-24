// packages/ui/src/components/cms/__tests__/RangeInput.test.tsx
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { RangeInput } from "../RangeInput";

describe("RangeInput", () => {
  test("emits px-suffixed values on user change", () => {
    const onChange = jest.fn();
    render(<RangeInput value="16px" onChange={onChange} min={10} max={20} />);
    const input = screen.getByRole("slider") as HTMLInputElement;

    // User change path still goes through onChange handler
    fireEvent.change(input, { target: { value: "18" } });
    expect(onChange).toHaveBeenCalledWith("18px");
    onChange.mockClear();
    fireEvent.change(input, { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("4px");
  });
});
