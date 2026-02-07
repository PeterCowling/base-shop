import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "./checkbox";

const meta: Meta = {
  title: "Atoms/Primitives/Checkbox",
};

export default meta;
type Story = StoryObj;

function CheckboxStory() {
  const [checked, setChecked] = useState(false);
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
      Receive updates
    </label>
  );
}

export const Default: Story = {
  render: () => <CheckboxStory />,
};
