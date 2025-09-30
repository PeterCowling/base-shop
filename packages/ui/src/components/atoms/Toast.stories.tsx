import { type Meta, type StoryObj } from "@storybook/react";
import { Toast } from "./Toast";
import * as React from "react";

const meta = {
  title: "Atoms/Toast",
  component: Toast,
  decorators: [
    (Story) => (
      <div className="space-y-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toast>;
export default meta;

type Story = StoryObj<typeof meta>;


export const SoftVariants = {
  render: () => (
    <>
      <Toast open message="Default soft toast" />
      <Toast open variant="info" message="Info soft toast" />
      <Toast open variant="success" message="Success soft toast" />
      <Toast open variant="warning" message="Warning soft toast" />
      <Toast open variant="danger" message="Danger soft toast" />
    </>
  ),
} satisfies Story;

export const SolidVariants = {
  render: () => (
    <>
      <Toast open tone="solid" message="Default solid toast" />
      <Toast open tone="solid" variant="info" message="Info solid toast" />
      <Toast open tone="solid" variant="success" message="Success solid toast" />
      <Toast open tone="solid" variant="warning" message="Warning solid toast" />
      <Toast open tone="solid" variant="danger" message="Danger solid toast" />
    </>
  ),
} satisfies Story;
