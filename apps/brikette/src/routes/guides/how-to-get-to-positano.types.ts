// src/routes/guides/how-to-get-to-positano.types.ts
export type TocItem = {
  href: string;
  label: string;
};

export type GuideSection = {
  id: string;
  title: string;
  body: string[];
};

export type WhenItem = {
  label: string;
  body: string;
};

export type GuideExtras = {
  intro: string[];
  sections: GuideSection[];
  toc: TocItem[];
  when: { heading: string; items: WhenItem[] };
  cheapest: { heading: string; steps: string[] };
  seasonal: { heading: string; points: string[] };
};

export type GuideFaq = {
  q: string;
  a: string[];
};
