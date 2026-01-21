// src/components/footer/footerTypes.ts
export type FooterLink = {
  key: string;
  label: string;
  href: string;
  external?: boolean;
  newTab?: boolean;
};

export type FooterGroup = {
  key: string;
  heading: string;
  links: FooterLink[];
};
