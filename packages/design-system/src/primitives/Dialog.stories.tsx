import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta: Meta = {
  title: "Atoms/Primitives/Dialog",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>
            This is a longer description to test wrapping and overflow behaviour in the dialog body.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-end">
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const SquareCorners: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open square dialog</Button>
      </DialogTrigger>
      <DialogContent shape="square">
        <DialogHeader>
          <DialogTitle>Square dialog</DialogTitle>
          <DialogDescription>Square corners for utilitarian workflows.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};
