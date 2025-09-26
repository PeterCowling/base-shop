import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Select";

describe("Select behaviors", () => {
  it("fires onValueChange on click and shows selected value", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="flavour">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Apple</SelectItem>
          <SelectItem value="b">Banana</SelectItem>
        </SelectContent>
      </Select>
    );

    // Placeholder visible before selection
    expect(screen.getByLabelText("flavour")).toHaveTextContent("Pick one");

    await user.click(screen.getByLabelText("flavour"));
    await user.click(screen.getByRole("option", { name: "Banana" }));

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("b"));
    // Trigger now shows the selected item text
    expect(screen.getByLabelText("flavour")).toHaveTextContent("Banana");
  });

  it("supports keyboard navigation and selection", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="pet">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cat">Cat</SelectItem>
          <SelectItem value="dog">Dog</SelectItem>
          <SelectItem value="owl">Owl</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByLabelText("pet");
    await user.click(trigger);
    // Typeahead to focus the option by label, then Enter to select
    await user.keyboard("d{Enter}"); // Dog

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("dog"));
    expect(trigger).toHaveTextContent("Dog");
  });

  it("respects disabled state and still renders placeholder", async () => {
    render(
      <Select disabled>
        <SelectTrigger aria-label="disabled-select">
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x">X</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByLabelText("disabled-select");
    expect(trigger).toHaveAttribute("data-disabled");
    expect(trigger).toHaveTextContent("Disabled");
  });

  it("can be opened and closed", async () => {
    const user = userEvent.setup();

    render(
      <Select>
        <SelectTrigger aria-label="fruit">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="x">X</SelectItem>
          <SelectItem value="y">Y</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByLabelText("fruit");
    await user.click(trigger);
    expect(await screen.findByRole("option", { name: "X" })).toBeInTheDocument();

    // Close with Escape
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("option", { name: "X" })).not.toBeInTheDocument()
    );
  });
});
