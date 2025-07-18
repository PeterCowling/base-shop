import { type Meta, type StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import { Tooltip, type TooltipProps } from "./Tooltip";

type TooltipStoryProps = TooltipProps & { position: "top" | "bottom" };

const meta: Meta<TooltipStoryProps> = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  argTypes: { position: { control: "radio", options: ["top", "bottom"] } },
  args: { text: "Info", position: "top" },
};
export default meta;

export const Default: StoryObj<TooltipStoryProps> = {
  render: (args) => (
    <div className="mt-10 flex justify-center">
      <Tooltip
        text={args.text}
        className={
          args.position === "bottom"
            ? "flex flex-col-reverse items-center"
            : undefined
        }
      >
        <button className="border p-2">
          <Icon name="heart" width={16} height={16} />
        </button>
      </Tooltip>
    </div>
  ),
};
