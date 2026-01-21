import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/atoms/shadcn";

describe("SelectPrimitive", () => {
  it("selects items with proper focus and class overrides", async () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger className="custom-trigger">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox");
    trigger.focus();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();

    const option = screen.getByRole("option", { name: "Banana" });
    fireEvent.click(option);

    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent("Banana");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveClass("custom-trigger");
  });
});
