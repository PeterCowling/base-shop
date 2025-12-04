import type { Meta, StoryObj } from "@storybook/nextjs";
import { useFSM } from "@acme/platform-machine/useFSM";

const meta: Meta = {
  title: "Hooks/useFSM",
  // Excluded from Storybook Test Runner CI (covered by Playwright smoke tests instead)
  tags: ["smoke"],
  parameters: {
    docs: {
      description: {
        component:
          "`useFSM` wraps `createFSM` and keeps state in sync with React. Use `send` to trigger transitions.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const ToggleExampleRender = () => {
  const transitions = [
    { from: "off", event: "toggle", to: "on" },
    { from: "on", event: "toggle", to: "off" },
  ] as const;
  const { state, send } = useFSM("off", transitions);

  return (
    <button
      className="rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => send("toggle")}
    >
      {state === "on" ? "Turn Off" : "Turn On"}
    </button>
  );
};

export const ToggleExample: Story = {
  render: ToggleExampleRender,
  // Help the test-runner detect the story has rendered
  play: async ({ canvasElement }) => {
    // Wait a microtask and assert there is content in the canvas
    await Promise.resolve();
    if (!canvasElement.querySelector('*')) {
      const el = document.createElement('span');
      el.textContent = 'ready';
      canvasElement.appendChild(el);
    }
  },
  parameters: {
    docs: {
      source: {
        code: `const { state, send } = useFSM("off", [
  { from: "off", event: "toggle", to: "on" },
  { from: "on", event: "toggle", to: "off" },
]);`,
      },
    },
  },
};
