import type { Meta, StoryObj } from "@storybook/react";
import ContactFormWithMap from "./ContactFormWithMap";

const meta: Meta<typeof ContactFormWithMap> = {
  component: ContactFormWithMap,
  args: {
    mapSrc:
      "https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed",
  },
};
export default meta;

export const Default: StoryObj<typeof ContactFormWithMap> = {};
