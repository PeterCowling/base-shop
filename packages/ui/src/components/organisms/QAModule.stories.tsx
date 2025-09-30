/* i18n-exempt file -- Storybook demo content uses literal strings */
import { type Meta, type StoryObj } from "@storybook/react";
import { QAModule } from "./QAModule";

const meta = {
  component: QAModule,
  args: {
    items: [
      { question: "What is the return policy?", answer: "30 days" }, // i18n-exempt: fixture content
      { question: "Do you ship internationally?", answer: "Yes" }, // i18n-exempt: fixture content
    ],
  },
} satisfies Meta<typeof QAModule>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
