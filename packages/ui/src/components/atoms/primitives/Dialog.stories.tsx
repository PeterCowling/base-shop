import { type Meta, type StoryObj } from "@storybook/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
  },
  args: {
    defaultOpen: true,
    triggerLabel: "Open dialog",
    title: "Schedule maintenance",
    description: "Choose a window that works best for you.",
  },
  argTypes: {
    defaultOpen: { control: "boolean" },
    triggerLabel: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
  },
} satisfies Meta<typeof Dialog>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: ({ triggerLabel, title, description, ...args }) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <button type="button" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground">
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogContent>
    </Dialog>
  ),
};
