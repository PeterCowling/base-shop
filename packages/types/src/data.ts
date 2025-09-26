// packages/types/src/data.ts
// Discriminated unions for common dataset items used by sections.

export type ProductItem = {
  kind: "product";
  id: string;
  title?: string;
  slug?: string;
  price?: number;
  compareAt?: number | null;
  image?: { src: string; alt?: string } | null;
  badges?: string[];
};

export type CollectionItem = {
  kind: "collection";
  id: string;
  title?: string;
  slug?: string;
  image?: { src: string; alt?: string } | null;
  productCount?: number;
};

export type ArticleItem = {
  kind: "article";
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  image?: { src: string; alt?: string } | null;
  date?: string;
};

export type StoreItem = {
  kind: "store";
  id: string;
  name?: string;
  lat?: number;
  lng?: number;
  address?: string;
  phone?: string;
};

export type ReviewItem = {
  kind: "review";
  id: string;
  author?: string;
  rating?: number; // 1-5
  title?: string;
  body?: string;
  productId?: string;
  createdAt?: string;
};

export type DataItem = ProductItem | CollectionItem | ArticleItem | StoreItem | ReviewItem;

