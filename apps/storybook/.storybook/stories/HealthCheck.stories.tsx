import type { Meta, StoryObj } from "@storybook/nextjs";

type BoxProps = {
  heading: string;
  message: string;
  buttonLabel: string;
  showButton?: boolean;
};

function Box({ heading, message, buttonLabel, showButton = true }: BoxProps) {
  return (
    <div style={{ padding: 16 }}>
      <h1>{heading}</h1>
      <p>{message}</p>
      {showButton ? <button>{buttonLabel}</button> : null}
    </div>
  );
}

const meta: Meta<typeof Box> = {
  title: "Health/Smoke",
  component: Box,
  tags: ["ci"],
  args: {
    heading: "Storybook CI Smoke Test",
    message: "Rendering OK",
    buttonLabel: "Click me",
    showButton: true,
  },
};
export default meta;

export const Ok: StoryObj<typeof Box> = {};

