import type { Meta, StoryObj } from "@storybook/react";
import ContactFormWithMap from "./ContactFormWithMap";

const meta = {
  component: ContactFormWithMap,
  args: {
    mapSrc:
      "https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed",
  },
} satisfies Meta<typeof ContactFormWithMap>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
