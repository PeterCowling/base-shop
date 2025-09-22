import type { Meta, StoryObj } from "@storybook/react";
import { useFSM } from "@acme/platform-machine/useFSM";

const meta: Meta = {
  title: "Hooks/useFSM",
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

export const ToggleExample: Story = {
  render: () => {
    const transitions = [
      { from: "off", event: "toggle", to: "on" },
      { from: "on", event: "toggle", to: "off" },
    ] as const;
    const { state, send } = useFSM("off", transitions);

    return (
      <button
        className="rounded bg-blue-600 px-4 py-2 text-white"
        onClick={() => send("toggle")}
      >
        {state === "on" ? "Turn Off" : "Turn On"}
      </button>
    );
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
