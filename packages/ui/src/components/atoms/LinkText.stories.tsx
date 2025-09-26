import { type Meta, type StoryObj } from "@storybook/react";
import { LinkText } from "./LinkText";

const meta: Meta<typeof LinkText> = {
  title: "Atoms/LinkText",
  component: LinkText,
};
export default meta;

export const Default: StoryObj<typeof LinkText> = {
  render: () => (
    <div className="space-x-3">
      <LinkText href="#">default</LinkText>
      <LinkText color="primary" href="#">primary</LinkText>
      <LinkText color="accent" href="#">accent</LinkText>
      <LinkText color="danger" href="#">danger</LinkText>
    </div>
  ),
};

export const SoftTone: StoryObj<typeof LinkText> = {
  render: () => (
    <div className="space-x-3">
      <LinkText tone="soft" href="#">default soft</LinkText>
      <LinkText tone="soft" color="primary" href="#">primary soft</LinkText>
      <LinkText tone="soft" color="accent" href="#">accent soft</LinkText>
      <LinkText tone="soft" color="danger" href="#">danger soft</LinkText>
    </div>
  ),
};

export const InsidePanel: StoryObj<typeof LinkText> = {
  render: () => (
    <div className="bg-panel border border-border-2 p-4">
      <p className="text-sm text-muted-foreground">
        This is a panel. <LinkText color="primary">Primary link</LinkText> and
        <span> </span>
        <LinkText tone="soft" color="accent">accent soft link</LinkText> render with appropriate contrast.
      </p>
    </div>
  ),
};

export const AsChild: StoryObj<typeof LinkText> = {
  render: () => (
    <div className="space-x-3">
      <LinkText asChild color="primary">
        <a href="#">asChild anchor</a>
      </LinkText>
      <LinkText asChild tone="soft" color="accent">
        <button type="button">asChild button</button>
      </LinkText>
    </div>
  ),
};
