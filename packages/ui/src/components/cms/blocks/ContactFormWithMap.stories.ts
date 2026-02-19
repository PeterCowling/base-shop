import type { Meta, StoryObj } from "@storybook/nextjs";

import ContactFormWithMap from "./ContactFormWithMap";

const meta: Meta<typeof ContactFormWithMap> = {
  title: "CMS Blocks/ContactFormWithMap",
  component: ContactFormWithMap,
  args: {
    mapSrc:
      "https://www.google.com/maps/embed/v1/place?key=&q=Hostel+Brikette+Positano+Italy&zoom=13",
  },
};
export default meta;

export const Default: StoryObj<typeof ContactFormWithMap> = {};
