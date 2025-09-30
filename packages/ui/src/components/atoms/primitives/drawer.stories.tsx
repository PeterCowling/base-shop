import { type Meta, type StoryObj } from "@storybook/react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerPortal } from "./drawer";
import { OverlayScrim } from "../index";

const meta = {
  title: "Primitives/Drawer",
  component: Drawer,
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Drawer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Right = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        {/* i18n-exempt: story demo control label */}
        <button className="rounded border px-4 min-h-10 min-w-10">Open right drawer</button>
      </DrawerTrigger>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="right" width="w-80" className="p-6">
          {/* i18n-exempt: story demo content */}
          <div className="text-sm">Panel surface drawer (right)</div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  ),
} satisfies Story;

export const Left = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        {/* i18n-exempt: story demo control label */}
        <button className="rounded border px-4 min-h-10 min-w-10">Open left drawer</button>
      </DrawerTrigger>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="left" width="w-64" className="p-6">
          {/* i18n-exempt: story demo content */}
          <div className="text-sm">Panel surface drawer (left)</div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  ),
} satisfies Story;
