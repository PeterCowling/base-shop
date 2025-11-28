import { type Meta, type StoryObj } from "@storybook/nextjs";
import { ColorSwatch } from "./ColorSwatch";
import { Inline } from "./primitives/Inline";

const meta: Meta<typeof ColorSwatch> = {
  title: "Atoms/ColorSwatch",
  component: ColorSwatch,
  argTypes: { selected: { control: "boolean" } },
  args: { selected: false },
};
export default meta;

const palette = [
  "hsl(var(--color-primary))",
  "hsl(var(--color-accent))",
  "hsl(var(--color-success))",
  "hsl(var(--color-warning))",
  "hsl(var(--color-info))",
];

export const Palette: StoryObj<typeof ColorSwatch> = {
  render: (args) => (
    <Inline gap={2}>
      {palette.map((color, i) => (
        <ColorSwatch
          key={color}
          color={color}
          selected={i === 0 && args.selected}
        />
      ))}
    </Inline>
  ),
};
