import { type Meta, type StoryObj } from "@storybook/react";
import { useState } from "react";
import { Radio, type RadioProps } from "./Radio";

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

export const Group: StoryObj<GroupProps> = {
  render: (args) => {
    const [selected, setSelected] = useState(args.selectedIndex);
    return (
      <div className="flex flex-col gap-2">
        {["One", "Two", "Three"].map((label, i) => (
          <Radio
            key={label}
            name="group"
            label={label}
            checked={selected === i}
            onChange={() => setSelected(i)}
          />
        ))}
      </div>
    );
  },
};
