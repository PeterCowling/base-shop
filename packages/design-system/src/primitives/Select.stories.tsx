import type { Meta, StoryObj } from "@storybook/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta: Meta = {
  title: "Atoms/Primitives/Select",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Select defaultValue="apple">
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Choose option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const ShapeDepths: Story = {
  render: () => (
    <div className="grid max-w-xs gap-3">
      <Select defaultValue="apple">
        <SelectTrigger shape="square">
          <SelectValue placeholder="Square select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="apple">
        <SelectTrigger shape="soft">
          <SelectValue placeholder="Soft select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="apple">
        <SelectTrigger shape="pill">
          <SelectValue placeholder="Pill select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const DensityScale: Story = {
  render: () => (
    <div className="grid max-w-xs gap-3">
      <Select defaultValue="apple">
        <SelectTrigger density="comfortable">
          <SelectValue placeholder="Comfortable density" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple" density="comfortable">
            Apple
          </SelectItem>
          <SelectItem value="banana" density="comfortable">
            Banana
          </SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="apple">
        <SelectTrigger density="compact">
          <SelectValue placeholder="Compact density" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple" density="compact">
            Apple
          </SelectItem>
          <SelectItem value="banana" density="compact">
            Banana
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
