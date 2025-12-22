// src/routes/guides/ferry-schedules/types.ts

export type FerrySection = {
  id: string;
  title: string;
  body: string[];
};

export type FerryFaq = {
  q: string;
  a: string[];
};

export type FerryGalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

export type GuideExtras = {
  intro: string[];
  sections: FerrySection[];
  tips: string[];
  tipsTitle?: string;
  faqs: FerryFaq[];
  faqsTitle: string;
  tocTitle: string;
  tocItems: Array<{ href: string; label: string }>;
  galleryTitle: string;
  galleryItems: FerryGalleryItem[];
};
