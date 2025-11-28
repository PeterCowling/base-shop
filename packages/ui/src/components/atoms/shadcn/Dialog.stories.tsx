import { type Meta, type StoryObj } from "@storybook/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

const meta: Meta<typeof Dialog> = {
  title: "Atoms/Shadcn/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: { open: { control: "boolean" } },
  args: { open: true },
};
export default meta;

export const Default: StoryObj<typeof Dialog> = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <button>Open</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};
