import "../../../../../../../test/resetNextMocks";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from "../combobox";

function renderCombobox(props: { onValueChange?: (value: string) => void } = {}) {
  return render(
    <Combobox {...props}>
      <ComboboxTrigger>Select fruit</ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search..." />
        <ComboboxItem value="apple">Apple</ComboboxItem>
        <ComboboxItem value="banana">Banana</ComboboxItem>
        <ComboboxItem value="cherry">Cherry</ComboboxItem>
        <ComboboxEmpty>No results</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
}

describe("Combobox", () => {
  // TC-01: Typing in input filters options
  it("filters options based on input", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const trigger = screen.getByRole("button", { name: "Select fruit" });
    await user.click(trigger);

    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "ban");

    await waitFor(() => {
      expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Banana" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Cherry" })).not.toBeInTheDocument();
    });
  });

  // TC-02: Arrow keys navigate items (Tab to move between input and items)
  it("navigates with keyboard between input and items", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const trigger = screen.getByRole("button", { name: "Select fruit" });
    await user.click(trigger);

    const input = screen.getByPlaceholderText("Search...");
    expect(input).toHaveFocus();

    const items = screen.getAllByRole("option");
    expect(items).toHaveLength(3);

    // Tab to first item
    await user.keyboard("{Tab}");
    expect(items[0]).toHaveFocus();
  });

  // TC-03: Enter/click selects item
  it("selects item on click and fires onValueChange", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();

    renderCombobox({ onValueChange });

    const trigger = screen.getByRole("button", { name: "Select fruit" });
    await user.click(trigger);

    const bananaOption = screen.getByRole("option", { name: "Banana" });
    await user.click(bananaOption);

    expect(onValueChange).toHaveBeenCalledWith("banana");
  });

  // TC-04: Empty state shown when no match
  it("shows empty state when no results match", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const trigger = screen.getByRole("button", { name: "Select fruit" });
    await user.click(trigger);

    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "xyz");

    await waitFor(() => {
      expect(screen.queryByRole("option")).not.toBeInTheDocument();
      expect(screen.getByText("No results")).toBeInTheDocument();
    });
  });

  // TC-05: Custom className merges on root
  it("merges custom className on trigger", () => {
    render(
      <Combobox>
        <ComboboxTrigger className="w-full">Select</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxItem value="a">A</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    );

    const trigger = screen.getByRole("button", { name: "Select" });
    expect(trigger).toHaveClass("w-full");
    expect(trigger).toHaveClass("flex");
  });

  // Additional: Test controlled value
  it("works with controlled value", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <Combobox value="apple" onValueChange={onValueChange}>
        <ComboboxTrigger>Select fruit</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxItem value="apple">Apple</ComboboxItem>
          <ComboboxItem value="banana">Banana</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    );

    const trigger = screen.getByRole("button", { name: "Select fruit" });
    await user.click(trigger);

    const bananaOption = screen.getByRole("option", { name: "Banana" });
    await user.click(bananaOption);

    expect(onValueChange).toHaveBeenCalledWith("banana");
  });

  // Additional: Test with keywords
  it("filters by keywords", async () => {
    const user = userEvent.setup();

    render(
      <Combobox>
        <ComboboxTrigger>Select fruit</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Search..." />
          <ComboboxItem value="apple" keywords={["red", "fruit"]}>
            Apple
          </ComboboxItem>
          <ComboboxItem value="carrot" keywords={["orange", "vegetable"]}>
            Carrot
          </ComboboxItem>
        </ComboboxContent>
      </Combobox>
    );

    const trigger = screen.getByRole("button", { name: "Select fruit" });
    await user.click(trigger);

    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "vegetable");

    await waitFor(() => {
      expect(screen.queryByRole("option", { name: "Apple" })).not.toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Carrot" })).toBeInTheDocument();
    });
  });
});
