import { type Meta, type StoryObj } from "@storybook/nextjs";

import { LinkText } from "./LinkText";

const meta: Meta<typeof LinkText> = {
  title: "Atoms/LinkText",
  component: LinkText,
};
export default meta;

export const Default: StoryObj<typeof LinkText> = {
  decorators: [
    (Story) => (
      <div className="space-x-3">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <LinkText href="/">default</LinkText>
      <LinkText color="primary" href="/">primary</LinkText>
      <LinkText color="accent" href="/">accent</LinkText>
      <LinkText color="danger" href="/">danger</LinkText>
    </>
  ),
};

export const SoftTone: StoryObj<typeof LinkText> = {
  decorators: [
    (Story) => (
      <div className="space-x-3">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <LinkText tone="soft" href="/">default soft</LinkText>
      <LinkText tone="soft" color="primary" href="/">primary soft</LinkText>
      <LinkText tone="soft" color="accent" href="/">accent soft</LinkText>
      <LinkText tone="soft" color="danger" href="/">danger soft</LinkText>
    </>
  ),
};

export const InsidePanel: StoryObj<typeof LinkText> = {
  decorators: [
    (Story) => (
      <div className="bg-panel border border-border-2 p-4">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <p className="text-sm text-muted-foreground">
      This is a panel. <LinkText color="primary">Primary link</LinkText> and
      <span> </span>
      <LinkText tone="soft" color="accent">accent soft link</LinkText> render with appropriate contrast.
    </p>
  ),
};

export const AsChild: StoryObj<typeof LinkText> = {
  decorators: [
    (Story) => (
      <div className="space-x-3">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <LinkText asChild color="primary">
        <a href="/">asChild anchor</a>
      </LinkText>
      <LinkText asChild tone="soft" color="accent">
        <button type="button">asChild button</button>
      </LinkText>
    </>
  ),
};
