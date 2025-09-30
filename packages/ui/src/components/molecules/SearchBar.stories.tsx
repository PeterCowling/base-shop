import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { SearchBar } from "./SearchBar";

const meta: Meta<typeof SearchBar> = {
  component: SearchBar,
  parameters: {
    docs: {
      description: {
        component:
          "Typeahead search input with keyboard-accessible suggestions. Supply `suggestions` for local filtering or call `onSearch` to trigger server-side queries.",
      },
    },
  },
  args: {
    suggestions: ["Apple", "Banana", "Cherry", "Date"],
    placeholder: "Search…",
    label: "Search",
  },
  argTypes: {
    onSelect: { action: "select" },
    onSearch: { action: "search" },
  },
};
export default meta;

export const Default: StoryObj<typeof SearchBar> = {
  play: async ({ canvasElement, args }) => {
    const selectSpy = fn();
    const searchSpy = fn();
    args.onSelect = selectSpy;
    args.onSearch = searchSpy;

    const canvas = within(canvasElement);
    const input = await canvas.findByRole("searchbox", { name: /search/i });

    await userEvent.type(input, "Ban");
    const bananaOption = await canvas.findByRole("option", { name: "Banana" });
    await userEvent.click(bananaOption);

    await expect(selectSpy).toHaveBeenCalledWith("Banana");
    await waitFor(() => expect(canvas.queryByRole("listbox")).not.toBeInTheDocument());

    await userEvent.clear(input);
    await userEvent.type(input, "Pear{enter}");

    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith("Pear"));
  },
};

export const PrefilledQuery: StoryObj<typeof SearchBar> = {
  args: {
    query: "sneakers",
    suggestions: ["Sneakers", "Sneakers green", "Sneakers leather"],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Populate the `query` prop to mirror a search term sourced from URL params or CMS filters.",
      },
    },
  },
};
