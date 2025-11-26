export type SectionDefinition = {
  title: string;
  body: string;
};

export type ImageSource = {
  src: string;
  altKey: string;
};

export const SECTIONS: SectionDefinition[] = [
  {
    title: "realEstate.sections.location.title",
    body: "realEstate.sections.location.body",
  },
  {
    title: "realEstate.sections.guests.title",
    body: "realEstate.sections.guests.body",
  },
  {
    title: "realEstate.sections.experience.title",
    body: "realEstate.sections.experience.body",
  },
];

export const HOSTEL_IMAGE_SOURCES: ImageSource[] = [
  { src: "/hostel-landing.webp", altKey: "showcase.hostel.imageAlt" },
  { src: "/landing-mobile.avif", altKey: "showcase.hostel.imageAlt" },
];

export const STEPFREE_IMAGE_SOURCES: ImageSource[] = [
  { src: "/StepFree.png", altKey: "showcase.step.imageAlt" },
  { src: "/stepfree-listing-1.jpg", altKey: "showcase.step.imageAlt" },
  { src: "/stepfree-listing-2.jpg", altKey: "showcase.step.imageAlt" },
];
