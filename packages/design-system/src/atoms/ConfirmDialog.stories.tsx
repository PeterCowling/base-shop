import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../primitives/button";

import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "Atoms/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function ConfirmDialogDemo({
  title,
  description,
  confirmLabel,
  variant,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "default" | "destructive";
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        onConfirm={() => {
          setOpen(false);
        }}
        variant={variant}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Confirm Action"
      confirmLabel="Confirm"
    />
  ),
};

export const Destructive: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Delete Item"
      description="This action cannot be undone. Are you sure you want to delete this item?"
      confirmLabel="Delete"
      variant="destructive"
    />
  ),
};

export const WithDescription: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Save Changes"
      description="You have unsaved changes. Do you want to save them before leaving?"
      confirmLabel="Save"
    />
  ),
};
