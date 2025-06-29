import { type Meta, type StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta: Meta<typeof Dialog> = {
  component: Dialog,
  args: {
    defaultOpen: true,
  },
  argTypes: {
    defaultOpen: { control: "boolean" },
  },
};
export default meta;

export const Default: StoryObj<typeof Dialog> = {
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
};
