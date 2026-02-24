import "../../../../../../../test/resetNextMocks";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from "../combobox";

import { LONG_SENTENCE_WITH_TOKEN, LONG_UNBROKEN_TOKEN } from "./fixtures/longContent";

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
    expect(bananaOption).toHaveClass("min-w-0");
    expect(bananaOption.querySelector("span.min-w-0.break-words")).not.toBeNull();
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

  it("renders long unbroken option labels with bleed guards", async () => {
    const user = userEvent.setup();

    render(
      <Combobox>
        <ComboboxTrigger>Select booking</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxItem value="long">{LONG_SENTENCE_WITH_TOKEN}</ComboboxItem>
          <ComboboxItem value="token">{LONG_UNBROKEN_TOKEN}</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    );

    await user.click(screen.getByRole("button", { name: "Select booking" }));

    const longItem = screen.getByRole("option", { name: LONG_SENTENCE_WITH_TOKEN });
    const tokenItem = screen.getByRole("option", { name: LONG_UNBROKEN_TOKEN });

    expect(longItem).toHaveClass("min-w-0", "break-words");
    expect(tokenItem).toHaveClass("min-w-0", "break-words");
    expect(tokenItem.querySelector("span.min-w-0.break-words")).not.toBeNull();
  });

  it("supports compact item density", async () => {
    const user = userEvent.setup();

    render(
      <Combobox>
        <ComboboxTrigger>Select booking</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxItem value="compact" density="compact">
            Compact option
          </ComboboxItem>
        </ComboboxContent>
      </Combobox>
    );

    await user.click(screen.getByRole("button", { name: "Select booking" }));
    const compactItem = screen.getByRole("option", { name: "Compact option" });
    expect(compactItem).toHaveClass("py-1");
    expect(compactItem).not.toHaveClass("py-1.5");
  });

  it("supports compact trigger and input density", async () => {
    const user = userEvent.setup();

    render(
      <Combobox>
        <ComboboxTrigger density="compact">Select booking</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput density="compact" placeholder="Search bookings..." />
          <ComboboxItem value="one">One</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    );

    const trigger = screen.getByRole("button", { name: "Select booking" });
    expect(trigger).toHaveClass("h-10", "px-2", "py-1.5");
    expect(trigger).not.toHaveClass("px-3", "py-2");

    await user.click(trigger);
    const input = screen.getByPlaceholderText("Search bookings...");
    expect(input).toHaveClass("h-10", "px-2", "py-1.5", "mb-0.5");
    expect(input).not.toHaveClass("px-3", "py-2", "mb-1");
  });
});
