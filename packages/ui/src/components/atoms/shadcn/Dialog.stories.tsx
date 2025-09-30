import { type Meta, type StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";

const meta = {
  title: "Atoms/Shadcn/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: { open: { control: "boolean" } },
  args: { open: true },
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
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
} satisfies Story;
