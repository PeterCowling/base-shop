import { type Meta, type StoryObj } from "@storybook/react";
import { LinkText } from "./LinkText";

const meta = {
  title: "Atoms/LinkText",
  component: LinkText,
} satisfies Meta<typeof LinkText>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {
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
} satisfies Story;

export const SoftTone = {
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
} satisfies Story;

export const InsidePanel = {
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
} satisfies Story;

export const AsChild = {
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
} satisfies Story;
