import type { Meta, StoryObj } from "@storybook/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const meta: Meta = {
  title: "Atoms/Primitives/Accordion",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Accordion type="multiple" className="w-full max-w-xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section one</AccordionTrigger>
        <AccordionContent>
          Content for the first section with extra-long text to test wrapping across devices.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section two</AccordionTrigger>
        <AccordionContent>
          Another paragraph with a longunbrokensequenceofcharacterswithoutspaces to test overflow handling.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
