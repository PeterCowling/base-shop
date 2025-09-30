import { type Meta, type StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import { Tooltip, type TooltipProps } from "./Tooltip";

type TooltipStoryProps = TooltipProps & { position: "top" | "bottom" };

const meta = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  argTypes: { position: { control: "radio", options: ["top", "bottom"] } },
  // i18n-exempt — storybook example text
  args: { text: "Info", position: "top" },
} satisfies Meta<TooltipStoryProps>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  decorators: [
    (Story) => (
      <div className="flex justify-center">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Tooltip
      text={args.text}
      className={
        args.position === "bottom"
          ? "flex flex-col-reverse items-center"
          : undefined
      }
    >
      <button className="border p-2 min-h-10 min-w-10">
        <Icon name="heart" width={16} height={16} />
      </button>
    </Tooltip>
  ),
} satisfies Story;
