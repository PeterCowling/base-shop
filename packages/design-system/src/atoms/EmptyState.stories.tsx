import { ExclamationTriangleIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../primitives/button";

import { EmptyState } from "./EmptyState";

const meta = {
  title: "Atoms/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No results found",
  },
};

export const WithDescription: Story = {
  args: {
    title: "No results found",
    description: "We couldn't find any items matching your search. Try adjusting your filters or search terms.",
  },
};

export const WithAction: Story = {
  args: {
    title: "No results found",
    description: "We couldn't find any items matching your search.",
    action: <Button>Clear filters</Button>,
    icon: <MagnifyingGlassIcon className="w-12 h-12" />,
  },
};

export const ErrorState: Story = {
  args: {
    title: "Something went wrong",
    description: "We encountered an error while loading your data. Please try again.",
    action: <Button variant="outline">Retry</Button>,
    icon: <ExclamationTriangleIcon className="w-12 h-12" />,
  },
};
