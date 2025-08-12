export interface MediaItem {
  url: string;
  title?: string;
  altText?: string;
  tags?: string[];
  type: "image" | "video";
}
