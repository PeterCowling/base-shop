export type PublishState = "draft" | "published" | "changed";

export function derivePublishState({
  status,
  updatedAt,
  publishedAt,
  publishedRevisionId,
  currentRevisionId,
}: {
  status: "draft" | "published";
  updatedAt?: string;
  publishedAt?: string;
  publishedRevisionId?: string;
  currentRevisionId?: string;
}): PublishState {
  if (status === "draft") return "draft";

  if (publishedRevisionId && currentRevisionId && publishedRevisionId !== currentRevisionId) {
    return "changed";
  }

  if (publishedAt && updatedAt && new Date(updatedAt).getTime() > new Date(publishedAt).getTime()) {
    return "changed";
  }

  return "published";
}
