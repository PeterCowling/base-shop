import { type Meta, type StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  component: Dialog,
  args: {
    defaultOpen: true,
  },
  argTypes: {
    defaultOpen: { control: "boolean" },
  },
} satisfies Meta<typeof Dialog>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <button>Open</button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogContent>
    </Dialog>
  ),
} satisfies Story;
