import { type Meta, type StoryObj } from "@storybook/nextjs";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
};
export default meta;

export const LegacyVariants: StoryObj<typeof Button> = {
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-2">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <Button variant="default">default</Button>
      <Button variant="outline">outline</Button>
      <Button variant="ghost">ghost</Button>
      <Button variant="destructive">destructive</Button>
    </>
  ),
};

export const TonesAndColors: StoryObj<typeof Button> = {
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-3">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button color="primary" tone="solid">primary solid</Button>
        <Button color="primary" tone="soft">primary soft</Button>
        <Button color="primary" tone="outline">primary outline</Button>
        <Button color="primary" tone="ghost">primary ghost</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button color="accent" tone="solid">accent solid</Button>
        <Button color="accent" tone="soft">accent soft</Button>
        <Button color="accent" tone="outline">accent outline</Button>
        <Button color="accent" tone="ghost">accent ghost</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button color="success" tone="solid">success solid</Button>
        <Button color="success" tone="soft">success soft</Button>
        <Button color="warning" tone="solid">warning solid</Button>
        <Button color="warning" tone="soft">warning soft</Button>
        <Button color="info" tone="solid">info solid</Button>
        <Button color="info" tone="soft">info soft</Button>
        <Button color="danger" tone="solid">danger solid</Button>
        <Button color="danger" tone="soft">danger soft</Button>
      </div>
    </>
  ),
};

export const WithIconsAndLoading: StoryObj<typeof Button> = {
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-2">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <Button leadingIcon={<span aria-hidden>★</span>}>
        Leading icon
      </Button>
      <Button trailingIcon={<span aria-hidden>›</span>} color="accent">
        Trailing icon
      </Button>
      <Button aria-busy color="primary">
        Busy state
      </Button>
      <Button iconOnly aria-label="More" tone="ghost">
        •••
      </Button>
      <Button disabled>Disabled</Button>
      <Button aria-disabled color="accent">Aria-disabled</Button>
    </>
  ),
};
