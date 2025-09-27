import { type Meta, type StoryObj } from "@storybook/react";
import { useState } from "react";
import { Radio, type RadioProps } from "./Radio";
import { Stack } from "./primitives/Stack";

type GroupProps = RadioProps & { selectedIndex: number };

const meta: Meta<GroupProps> = {
  title: "Atoms/Radio",
  component: Radio,
  argTypes: {
    selectedIndex: { control: { type: "inline-radio", options: [0, 1, 2] } },
  },
  args: { selectedIndex: 0 },
};
export default meta;

const GroupRender = (args: GroupProps) => {
  const [selected, setSelected] = useState(args.selectedIndex);
  return (
    <Stack gap={2}>
      {["One", "Two", "Three"].map((label, i) => (
        <Radio
          key={label}
          name="group"
          label={label}
          checked={selected === i}
          onChange={() => setSelected(i)}
        />
      ))}
    </Stack>
  );
};

export const Group: StoryObj<GroupProps> = {
  render: (args) => <GroupRender {...args} />,
};
