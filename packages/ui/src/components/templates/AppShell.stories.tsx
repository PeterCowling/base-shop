// packages/ui/components/templates/AppShell.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { Content } from "../organisms/Content";
import { Footer } from "../organisms/Footer";
import { Header } from "../organisms/Header";
import { SideNav } from "../organisms/SideNav";
import { AppShell } from "./AppShell";

const meta: Meta<typeof AppShell> = {
  title: "Layout/AppShell",
  component: AppShell,
  tags: ["autodocs"],
};
export default meta;

export const Default: StoryObj<typeof AppShell> = {
  render: () => (
      <AppShell
        header={<Header locale="en" shopName="Demo">Header</Header>}
        sideNav={<SideNav>Nav</SideNav>}
        footer={<Footer shopName="Demo">Footer</Footer>}
      >
      <Content>Content</Content>
    </AppShell>
  ),
};
