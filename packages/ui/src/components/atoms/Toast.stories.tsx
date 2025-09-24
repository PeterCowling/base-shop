import { type Meta, type StoryObj } from "@storybook/react";
import { Toast } from "./Toast";
import * as React from "react";

const meta: Meta<typeof Toast> = {
  title: "Atoms/Toast",
  component: Toast,
};
export default meta;

export const SoftVariants: StoryObj<typeof Toast> = {
  render: () => (
    <div className="space-y-3">
      <Toast open message="Default soft toast" />
      <Toast open variant="info" message="Info soft toast" />
      <Toast open variant="success" message="Success soft toast" />
      <Toast open variant="warning" message="Warning soft toast" />
      <Toast open variant="danger" message="Danger soft toast" />
    </div>
  ),
};

export const SolidVariants: StoryObj<typeof Toast> = {
  render: () => (
    <div className="space-y-3">
      <Toast open tone="solid" message="Default solid toast" />
      <Toast open tone="solid" variant="info" message="Info solid toast" />
      <Toast open tone="solid" variant="success" message="Success solid toast" />
      <Toast open tone="solid" variant="warning" message="Warning solid toast" />
      <Toast open tone="solid" variant="danger" message="Danger solid toast" />
    </div>
  ),
};

