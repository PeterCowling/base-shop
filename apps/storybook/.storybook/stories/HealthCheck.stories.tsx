import type { Meta, StoryObj } from "@storybook/react";

function Box() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Storybook CI Smoke Test</h1>
      <p>Rendering OK</p>
      <button>Click me</button>
    </div>
  );
}

const meta: Meta<typeof Box> = {
  title: "Health/Smoke",
  component: Box,
  tags: ["ci"],
};
export default meta;

export const Ok: StoryObj<typeof Box> = {};

