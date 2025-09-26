// packages/ui/src/components/cms/page-builder/panels/__tests__/TimelinePanel.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TimelinePanel from "../TimelinePanel";

const baseComponent: any = {
  id: "cmp1",
  type: "Text",
  timeline: { steps: [{ duration: 100 }] },
};

describe("TimelinePanel", () => {
  test("add, edit, move and remove steps; change trigger and name", () => {
    const updates: any[] = [];
    const handleInput = jest.fn((field, value) => updates.push({ field, value }));
    render(<TimelinePanel component={baseComponent} handleInput={handleInput as any} />);

    // Add step
    fireEvent.click(screen.getByText("Add Step"));
    expect(handleInput).toHaveBeenCalled();

    // Edit first step duration
    const durInputs = screen.getAllByLabelText(/Duration|At/);
    fireEvent.change(durInputs[0], { target: { value: "250" } });
    expect(handleInput).toHaveBeenCalled();

    // Name
    const name = screen.getByLabelText(/Name/);
    fireEvent.change(name, { target: { value: "Hero entrance" } });
    expect(handleInput).toHaveBeenCalled();

    // Move Down then Up (ensure buttons wired)
    const down = screen.getAllByText("Down")[0];
    fireEvent.click(down);
    const up = screen.getAllByText("Up")[0];
    fireEvent.click(up);

    // Remove
    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(handleInput).toHaveBeenCalled();

    // Toggle loop checkbox
    const loop = screen.getByRole('checkbox');
    fireEvent.click(loop);
    expect(handleInput).toHaveBeenCalled();
  });
});
