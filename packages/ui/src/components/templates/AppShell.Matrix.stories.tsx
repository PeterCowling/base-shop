// packages/ui/components/templates/AppShell.Matrix.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";

import { makeStateStory } from "../../story-utils/createStories";
import { AppShell } from "./AppShell";
import { buildAppShellArgs } from "./AppShell.story-helpers";

const componentDescription = `High-level application shell. Wraps header/side navigation/footer and content, providing Theme/Layout providers.

Usage:

\`\`\`tsx
import { AppShell } from './AppShell';
import { Header } from '../organisms/Header';
import { SideNav } from '../organisms/SideNav';
import { Footer } from '../organisms/Footer';
import { Content } from '../organisms/Content';

<AppShell
  header={<Header locale={"en" as any} shopName="Demo" nav={[]} />}
  sideNav={<SideNav>Nav</SideNav>}
  footer={<Footer shopName="Demo">Footer</Footer>}
>
  <Content>Content</Content>
</AppShell>

// Key args: header, sideNav, footer, children
\`\`\``;

const meta = {
  title: "Templates/AppShell/Matrix",
  component: AppShell,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component: componentDescription,
      },
    },
  },
  args: buildAppShellArgs(),
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, "default", {
  a11y: true,
  viewports: ["desktop"],
  tags: ["visual"],
  docsDescription: "Shell with header, side navigation and footer around page content.",
});

export const Loading: Story = makeStateStory(baseArgs, { sideNav: null }, "loading", {
  viewports: ["mobile1"],
  tags: ["visual"],
  docsDescription: "Simulated loading: side navigation hidden to mimic minimal shell.",
});

export const Empty: Story = makeStateStory(baseArgs, { children: null }, "empty", {
  a11y: true,
  viewports: ["mobile1"],
  tags: ["visual"],
  docsDescription: "No children content; demonstrates shell-only state.",
});

export const Error: Story = makeStateStory(baseArgs, {}, "error", {
  a11y: true,
  critical: true,
  viewports: ["desktop"],
  tags: ["visual", "ci"],
  docsDescription: "Matrix completeness state; no network behavior.",
});

export const RTL: Story = makeStateStory(baseArgs, {}, "default", {
  rtl: true,
  viewports: ["mobile1"],
  tags: ["visual"],
  docsDescription: "RTL sample for shell chrome and content region.",
});
