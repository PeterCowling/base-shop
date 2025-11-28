import type { Meta, StoryObj } from "@storybook/nextjs";

interface ErrorButtonProps {
  readonly label: string;
  readonly triggerError?: boolean;
}

function ErrorButton({ label, triggerError = false }: ErrorButtonProps) {
  if (triggerError) {
    throw new Error("Portable stories usage guard triggered");
  }

  return (
    <button type="button" data-testid="error-button">
      {label}
    </button>
  );
}

const meta: Meta<typeof ErrorButton> = {
  title: "Diagnostics/ErrorButton",
  component: ErrorButton,
  parameters: {
    docs: {
      description: {
        component:
          "Utility stories that exercise error boundaries for portable-story tests.",
      },
    },
  },
  args: {
    label: "Trigger",
  },
};

export default meta;

type Story = StoryObj<typeof ErrorButton>;

export const SafeUsage: Story = {};

export const ThrowsUsageError: Story = {
  args: {
    triggerError: true,
  },
  tags: ["!dev", "!test"],
};
