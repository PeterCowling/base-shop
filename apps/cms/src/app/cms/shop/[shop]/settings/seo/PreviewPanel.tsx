"use client";

import Image from "next/image";
import type { FC } from "react";

interface Props {
  /** Page title */
  title: string;
  /** Meta description */
  description?: string;
  /** Image URL for social preview */
  image?: string;
  /** Page URL */
  url?: string;
}

/**
 * Renders live previews for search engine result pages and social cards.
 */
const PreviewPanel: FC<Props> = ({
  title,
  description = "",
  image,
  url = "example.com",
}) => {
  const placeholder = {
    title: title || "Title goes here",
    description: description || "Description goes here",
    url,
  };

  return (
    <div className="space-y-6">
      {/* SERP preview -------------------------------------------------- */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Google result</p>
        <div className="rounded-md border p-4 text-sm">
          <p className="text-primary">{placeholder.title}</p>
          <p className="text-success">{placeholder.url}</p>
          <p className="text-muted-foreground">{placeholder.description}</p>
        </div>
      </div>

      {/* Open Graph preview -------------------------------------------- */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Open Graph</p>
        <div className="flex gap-4 rounded-md border p-4">
          {image && (
            <Image
              src={image}
              alt="preview image"
              width={120}
              height={120}
              className="size-20 rounded object-cover"
            />
          )}
          <div className="text-sm">
            <p className="font-medium">{placeholder.title}</p>
            <p className="text-muted-foreground">{placeholder.description}</p>
            <p className="text-muted-foreground">{placeholder.url}</p>
          </div>
        </div>
      </div>

      {/* Twitter card preview ----------------------------------------- */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Twitter card</p>
        <div className="flex gap-4 rounded-md border p-4">
          {image && (
            <Image
              src={image}
              alt="preview image"
              width={120}
              height={120}
              className="size-20 rounded object-cover"
            />
          )}
          <div className="text-sm">
            <p className="font-medium">{placeholder.title}</p>
            <p className="text-muted-foreground">{placeholder.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
