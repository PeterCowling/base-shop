import { getCsrfToken } from "@acme/lib/security";
import type { ImageOrientation, MediaItem } from "@acme/types";

export interface UploadParams {
  shop: string;
  requiredOrientation: ImageOrientation;
  file: File;
  altText?: string;
  tagsCsv?: string;
}

export interface UploadResult {
  item?: MediaItem;
  error?: string;
}

/**
 * Post FormData to CMS upload endpoint and parse response.
 */
export async function uploadToCms({ shop, requiredOrientation, file, altText, tagsCsv }: UploadParams): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  if (altText) fd.append("altText", altText);
  if (tagsCsv) {
    const tagList = tagsCsv
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length) fd.append("tags", JSON.stringify(tagList));
  }

  try {
    const csrfToken = getCsrfToken();
    const res = await fetch(`/api/media?shop=${shop}&orientation=${requiredOrientation}`, {
      method: "POST",
      headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    return { item: data as MediaItem };
  } catch (err) {
    if (err instanceof Error) return { error: err.message };
    return {};
  }
}
