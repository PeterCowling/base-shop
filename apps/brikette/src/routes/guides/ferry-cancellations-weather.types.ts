export type FerrySection = { id: string; title: string; body: string[] };

export type FerryFaq = { q: string; a: string[] };

export type FerryGalleryItem = { src: string; alt: string; caption?: string };

export type GuideExtras = {
  intro: string[];
  sections: FerrySection[];
  tips: string[];
  tipsTitle?: string;
  faqs: FerryFaq[];
  faqsTitle: string;
  galleryTitle?: string;
  galleryItems: FerryGalleryItem[];
  tocTitle: string;
  tocItems: Array<{ href: string; label: string }>;
};
