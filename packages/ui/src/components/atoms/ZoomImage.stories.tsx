import { type Meta, type StoryObj } from "@storybook/nextjs";
import { expect, userEvent, within } from "@storybook/test";
import { ZoomImage } from "./ZoomImage";

const meta: Meta<typeof ZoomImage> = {
  title: "Atoms/ZoomImage",
  component: ZoomImage,
  args: {
    src: "https://picsum.photos/800/600",
    alt: "Sample",
    width: 400,
    height: 300,
  },
};
export default meta;

export const ClickZoom: StoryObj<typeof ZoomImage> = {};

export const HoverZoom: StoryObj<typeof ZoomImage> = {
  args: { className: "hover:scale-125" },
};

export const Default: StoryObj<typeof ZoomImage> = {};

export const KeyboardToggle: StoryObj<typeof ZoomImage> = {
  args: {
    src: "https://picsum.photos/600/400",
    alt: "Zoomable sample",
    width: 400,
    height: 300,
  },
  parameters: { a11y: true, tags: ["visual", "ci"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const figure = canvas.getByRole("button", { name: /zoom image/i });
    await userEvent.keyboard("{Enter}");
    expect(figure).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Enter}");
    expect(figure).toHaveAttribute("aria-pressed", "false");
  },
};
