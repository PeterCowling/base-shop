import { type Meta, type StoryObj } from "@storybook/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

const meta: Meta<typeof DropdownMenu> = {
  title: "Primitives/DropdownMenu",
  component: DropdownMenu,
};
export default meta;

export const PanelSurface: StoryObj<typeof DropdownMenu> = {
  render: () => (
    <div className="p-8">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Archive</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

export const Submenu: StoryObj<typeof DropdownMenu> = {
  render: () => (
    <div className="p-8">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open menu with sub</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger>Move to…</DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent className="w-40">
              <DropdownMenuItem>Inbox</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};
