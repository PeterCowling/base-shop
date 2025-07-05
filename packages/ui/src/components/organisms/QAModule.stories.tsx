import { type Meta, type StoryObj } from "@storybook/react";
import { QAModule } from "./QAModule";

const meta: Meta<typeof QAModule> = {
  component: QAModule,
  args: {
    items: [
      { question: "What is the return policy?", answer: "30 days" },
      { question: "Do you ship internationally?", answer: "Yes" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof QAModule> = {};
