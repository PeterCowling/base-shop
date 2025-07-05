import { type Meta, type StoryObj } from "@storybook/react";
import { ColorSwatch } from "./ColorSwatch";

const meta: Meta<typeof ColorSwatch> = {
  title: "Atoms/ColorSwatch",
  component: ColorSwatch,
  argTypes: { selected: { control: "boolean" } },
  args: { selected: false },
};
export default meta;

const palette = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];

export const Palette: StoryObj<typeof ColorSwatch> = {
  render: (args) => (
    <div className="flex gap-2">
      {palette.map((color, i) => (
        <ColorSwatch
          key={color}
          color={color}
          selected={i === 0 && args.selected}
        />
      ))}
    </div>
  ),
};
