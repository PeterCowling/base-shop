import { type Meta, type StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Atoms/Switch",
  component: Switch,
};
export default meta;

export const Uncontrolled: StoryObj<typeof Switch> = {};

export const Controlled: StoryObj<typeof Switch> = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Switch checked={checked} onChange={() => setChecked(!checked)} />;
  },
};
