import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { FileSelector } from "./FileSelector";

const meta: Meta<typeof FileSelector> = {
  title: "Atoms/FileSelector",
  component: FileSelector,
  args: {
    label: "Upload files",
    description: "Attach images or documents.",
    multiple: true,
  },
};

export default meta;
type Story = StoryObj<typeof FileSelector>;

export const Default: Story = {};

function WithPreviewTemplate(args: React.ComponentProps<typeof FileSelector>) {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      <FileSelector
        {...args}
        onFilesSelected={(files) => setNames(files.map((f) => f.name))}
      />
      {names.length > 0 && (
        <ul className="text-sm">
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const WithPreview: Story = {
  render: (args) => <WithPreviewTemplate {...args} />,
};
