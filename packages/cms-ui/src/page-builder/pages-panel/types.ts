export type PageItem = {
  id: string;
  slug: string;
  title?: string;
  seo?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    image?: string;
    noindex?: boolean;
  };
  visibility?: "public" | "hidden";
  updatedAt?: string;
};

