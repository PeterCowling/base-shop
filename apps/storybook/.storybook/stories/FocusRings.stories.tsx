import type { Meta, StoryObj } from "@storybook/nextjs";

const meta: Meta = {
  title: "Foundation/Focus Rings",
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Focusable button
      </button>
      <a
        href="#"
        className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Focusable link
      </a>
      <input
        type="text"
        placeholder="Focusable input"
        className="h-11 w-64 rounded-md border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      <select className="h-11 w-64 rounded-md border border-border bg-input px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <option>Focusable select</option>
        <option>Option 2</option>
      </select>
    </div>
  ),
};
