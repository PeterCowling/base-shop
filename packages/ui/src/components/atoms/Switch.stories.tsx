import { type Meta, type StoryObj } from "@storybook/react";
import { useState } from "react";
import { Switch } from "./Switch";

const meta = {
  title: "Atoms/Switch",
  component: Switch,
} satisfies Meta<typeof Switch>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Uncontrolled = {} satisfies Story;

const ControlledRender = () => {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onChange={() => setChecked(!checked)} />;
};

export const Controlled = {
  render: () => <ControlledRender />,
} satisfies Story;
