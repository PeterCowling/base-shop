// packages/ui/components/templates/AppShell.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { Content } from "../organisms/Content";
import { Footer } from "../organisms/Footer";
import { Header } from "../organisms/Header";
import { SideNav } from "../organisms/SideNav";
import { AppShell } from "./AppShell";

const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "High-level layout wrapper that provides theme and navigation context. Supply header, side navigation and footer slots to compose full page chrome.",
      },
    },
  },
} satisfies Meta<typeof AppShell>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
  render: () => (
    <AppShell
      header={<Header locale="en" shopName="Demo">Header</Header>}
      sideNav={<SideNav>Nav</SideNav>}
      footer={<Footer shopName="Demo">Footer</Footer>}
    >
      <Content>Content</Content>
    </AppShell>
  ),
} satisfies Story;

export const WithCustomBackground = {
  render: () => (
    <AppShell
      className="bg-bg"
      header={<Header locale="en" shopName="Demo">Header</Header>}
      sideNav={<SideNav>Nav</SideNav>}
      footer={<Footer shopName="Demo">Footer</Footer>}
    >
      <Content>Content</Content>
    </AppShell>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Pass Tailwind classes through `className` to match application-specific backgrounds or spacing requirements.",
      },
    },
  },
} satisfies Story;
