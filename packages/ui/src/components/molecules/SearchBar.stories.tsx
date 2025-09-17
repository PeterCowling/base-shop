import type { Meta, StoryObj } from "@storybook/react";
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

export const Default: StoryObj<typeof SearchBar> = {};

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
