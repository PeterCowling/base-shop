import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Copy, Edit, Share2, Trash2 } from "lucide-react";
import { ActionSheet } from "./ActionSheet";
import { Inline, Stack } from "../../../atoms/primitives";

const meta: Meta<typeof ActionSheet> = {
  title: "Organisms/Operations/ActionSheet",
  component: ActionSheet,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="context-operations min-h-screen bg-surface-1 p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActionSheet>;

const PRIMARY_BUTTON_CLASS =
  "rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-sm transition hover:bg-primary/90";
const SECONDARY_BUTTON_CLASS =
  "rounded-lg border border-border-1 bg-surface-1 px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-2";
const DANGER_BUTTON_CLASS =
  "rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground shadow-sm hover:bg-danger/90";
const ROW_BUTTON_CLASS =
  "w-full rounded-lg px-4 py-3 text-start text-foreground hover:bg-surface-2";
const ROW_DESTRUCTIVE_CLASS =
  "w-full rounded-lg px-4 py-3 text-start text-danger hover:bg-danger/10";

function ActionSheetDefaultStory(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={PRIMARY_BUTTON_CLASS}
      >
        Open Action Sheet
      </button>

      <ActionSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Quick Actions"
        description="Choose an action to perform on this item"
      >
        <Stack gap={2}>
          <Inline asChild gap={3}>
            <button
              type="button"
              className={ROW_BUTTON_CLASS}
              onClick={() => {
                alert("Edit clicked");
                setIsOpen(false);
              }}
            >
              <Edit className="h-5 w-5" />
              <Stack gap={1}>
                <div className="font-medium">Edit Item</div>
                <div className="text-sm text-foreground/60">Modify item details</div>
              </Stack>
            </button>
          </Inline>

          <Inline asChild gap={3}>
            <button
              type="button"
              className={ROW_BUTTON_CLASS}
              onClick={() => {
                alert("Copy clicked");
                setIsOpen(false);
              }}
            >
              <Copy className="h-5 w-5" />
              <Stack gap={1}>
                <div className="font-medium">Duplicate</div>
                <div className="text-sm text-foreground/60">Create a copy</div>
              </Stack>
            </button>
          </Inline>

          <Inline asChild gap={3}>
            <button
              type="button"
              className={ROW_BUTTON_CLASS}
              onClick={() => {
                alert("Share clicked");
                setIsOpen(false);
              }}
            >
              <Share2 className="h-5 w-5" />
              <Stack gap={1}>
                <div className="font-medium">Share</div>
                <div className="text-sm text-foreground/60">Share with team</div>
              </Stack>
            </button>
          </Inline>

          <Inline asChild gap={3}>
            <button
              type="button"
              className={ROW_DESTRUCTIVE_CLASS}
              onClick={() => {
                alert("Delete clicked");
                setIsOpen(false);
              }}
            >
              <Trash2 className="h-5 w-5" />
              <Stack gap={1}>
                <div className="font-medium">Delete</div>
                <div className="text-sm text-foreground/70">Permanently remove</div>
              </Stack>
            </button>
          </Inline>
        </Stack>
      </ActionSheet>
    </>
  );
}

export const Default: Story = {
  render: () => <ActionSheetDefaultStory />,
};

function ActionSheetWithFormStory(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const nameId = "action-sheet-item-name";
  const skuId = "action-sheet-item-sku";
  const qtyId = "action-sheet-item-qty";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={PRIMARY_BUTTON_CLASS}
      >
        Add New Item
      </button>

      <ActionSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Inventory Item"
        description="Fill in the details for the new item"
      >
        <form className="space-y-4">
          <div>
            <label htmlFor={nameId} className="block text-sm font-medium text-foreground">
              Item Name
            </label>
            <input
              id={nameId}
              type="text"
              className="mt-1 block w-full rounded-md border border-border-1 bg-surface-1 px-3 py-2 text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="Enter item name"
            />
          </div>
          <div>
            <label htmlFor={skuId} className="block text-sm font-medium text-foreground">
              SKU
            </label>
            <input
              id={skuId}
              type="text"
              className="mt-1 block w-full rounded-md border border-border-1 bg-surface-1 px-3 py-2 text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="e.g., PROD-001"
            />
          </div>
          <div>
            <label htmlFor={qtyId} className="block text-sm font-medium text-foreground">
              Quantity
            </label>
            <input
              id={qtyId}
              type="number"
              className="mt-1 block w-full rounded-md border border-border-1 bg-surface-1 px-3 py-2 text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="0"
            />
          </div>
          <Inline gap={3} className="justify-end pt-4" wrap={false}>
            <button type="button" onClick={() => setIsOpen(false)} className={SECONDARY_BUTTON_CLASS}>
              Cancel
            </button>
            <button type="submit" className={PRIMARY_BUTTON_CLASS}>
              Add Item
            </button>
          </Inline>
        </form>
      </ActionSheet>
    </>
  );
}

export const WithForm: Story = {
  render: () => <ActionSheetWithFormStory />,
};

function ActionSheetWithLongContentStory(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={PRIMARY_BUTTON_CLASS}
      >
        View All Items
      </button>

      <ActionSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="All Items"
        description="Select an item to view details"
      >
        <Stack gap={2}>
          {items.map((item) => (
            <Inline asChild key={item.id} gap={3}>
              <button
                type="button"
                className={ROW_BUTTON_CLASS}
                onClick={() => {
                  alert(`Selected: ${item.name}`);
                  setIsOpen(false);
                }}
              >
                <Stack gap={1}>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-foreground/60">{item.description}</div>
                </Stack>
              </button>
            </Inline>
          ))}
        </Stack>
      </ActionSheet>
    </>
  );
}

export const WithLongContent: Story = {
  render: () => <ActionSheetWithLongContentStory />,
};

function ActionSheetNoBackdropStory(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={PRIMARY_BUTTON_CLASS}
      >
        Open (No Backdrop Close)
      </button>

      <ActionSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        description="This action cannot be undone"
        closeOnBackdropClick={false}
      >
        <Stack gap={4}>
          <p className="text-sm text-foreground/70">
            Are you sure you want to proceed? This will permanently delete the item.
          </p>
          <Inline gap={3} className="justify-end" wrap={false}>
            <button type="button" onClick={() => setIsOpen(false)} className={SECONDARY_BUTTON_CLASS}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                alert("Confirmed");
                setIsOpen(false);
              }}
              className={DANGER_BUTTON_CLASS}
            >
              Delete
            </button>
          </Inline>
        </Stack>
      </ActionSheet>
    </>
  );
}

export const NoBackdropClose: Story = {
  render: () => <ActionSheetNoBackdropStory />,
};
