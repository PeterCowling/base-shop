import type { Meta, StoryObj } from "@storybook/react";

import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" aria-label="View density">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="compact" />
        <label htmlFor="compact" className="text-sm">
          Compact
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="comfortable" />
        <label htmlFor="comfortable" className="text-sm">
          Comfortable
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="spacious" id="spacious" />
        <label htmlFor="spacious" className="text-sm">
          Spacious
        </label>
      </div>
    </RadioGroup>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option1" aria-label="Options">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option1" id="o1" />
        <label htmlFor="o1" className="text-sm">
          Available
        </label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="o2" disabled />
        <label htmlFor="o2" className="text-sm text-muted-foreground">
          Unavailable
        </label>
      </div>
    </RadioGroup>
  ),
};
