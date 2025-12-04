import type { Meta, StoryObj } from "@storybook/react";
import CodeBlock from "./CodeBlock";

const sampleCode = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));`;

const meta: Meta<typeof CodeBlock> = {
  title: "Molecules/CodeBlock",
  component: CodeBlock,
  args: {
    code: sampleCode,
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const Default: Story = {};

export const WithCustomLabels: Story = {
  args: {
    copyLabel: "Copy snippet",
    copiedLabel: "Copied!",
  },
};
