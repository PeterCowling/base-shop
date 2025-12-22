export type GalleryItem = { caption: string; alt: string };

export type GalleryContent = { title?: string; items: GalleryItem[] };

export type ItemListEntry = { name: string; note: string };

export type FaqEntry = { q: string; a: string[] };
