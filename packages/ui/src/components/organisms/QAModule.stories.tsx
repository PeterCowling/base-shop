/* i18n-exempt file -- Storybook demo content uses literal strings */
import { type Meta, type StoryObj } from "@storybook/nextjs";

import { QAModule } from "./QAModule";

const meta: Meta<typeof QAModule> = {
  title: "Organisms/QAModule",
  component: QAModule,
  args: {
    items: [
      { question: "What is the return policy?", answer: "30 days" }, // i18n-exempt: fixture content
      { question: "Do you ship internationally?", answer: "Yes" }, // i18n-exempt: fixture content
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof QAModule> = {};
