import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";

import { DatePicker } from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "Molecules/DatePicker",
  component: DatePicker,
  args: {
    placeholderText: "Select a date",
    dateFormat: "MM/dd/yyyy",
    onChange: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  args: {
    selected: null,
  },
};

export const WithSelectedDate: Story = {
  args: {
    selected: new Date(),
  },
};

export const WithMinMaxDates: Story = {
  args: {
    selected: null,
    minDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    maxDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  },
};

export const WithTimeSelect: Story = {
  args: {
    selected: null,
    showTimeSelect: true,
    dateFormat: "MM/dd/yyyy h:mm aa",
  },
};

export const Clearable: Story = {
  args: {
    selected: new Date(),
    isClearable: true,
  },
};

export const Inline: Story = {
  args: {
    selected: null,
    inline: true,
  },
};

export const Disabled: Story = {
  args: {
    selected: new Date(),
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    selected: null,
    invalid: true,
    placeholderText: "Invalid date selection",
  },
};
