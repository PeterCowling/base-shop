export type ManualSection = {
  id?: unknown;
  title?: unknown;
  heading?: unknown;
  body?: unknown;
  items?: unknown;
};

export type ManualTocItem = { href?: unknown; label?: unknown };

export type ManualFallback = {
  intro?: unknown;
  sections?: ManualSection[];
  toc?: ManualTocItem[];
  tocTitle?: unknown;
  faq?: { summary?: unknown; answer?: unknown };
};

export type NormalisedManualSection = {
  id: string;
  title: string;
  body: string[];
};
