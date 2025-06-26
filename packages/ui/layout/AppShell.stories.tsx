// packages/ui/layout/AppShell.stories.rsx

import type { Meta, StoryObj } from "@storybook/react";
import { AppShell } from "./AppShell";
import { Content } from "./Content";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SideNav } from "./SideNav";

const meta: Meta<typeof AppShell> = {
  title: "Layout/AppShell",
  component: AppShell,
  tags: ["autodocs"],
};
export default meta;

export const Default: StoryObj<typeof AppShell> = {
  render: () => (
    <AppShell
      header={<Header>Header</Header>}
      sideNav={<SideNav>Nav</SideNav>}
      footer={<Footer>Footer</Footer>}
    >
      <Content>Content</Content>
    </AppShell>
  ),
};
