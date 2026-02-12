import type { Idea } from "@acme/platform-core/repositories/businessOs.server";

import type { IdeaListItem } from "./types";

function extractTitle(content: string, fallbackId: string): string {
  const firstNonEmpty = content.split("\n").find((line) => line.trim().length > 0);
  if (!firstNonEmpty) return fallbackId;
  return firstNonEmpty.replace(/^#+\s*/, "").trim() || fallbackId;
}

function inferLocation(filePath: string): "inbox" | "worked" {
  if (filePath.includes("/ideas/worked/")) return "worked";
  return "inbox";
}

export function toIdeaListItem(idea: Idea): IdeaListItem {
  const id = idea.ID ?? "UNKNOWN-IDEA";
  const business = idea.Business ?? "unknown";
  const status = idea.Status ?? "raw";
  const priority = idea.Priority ?? "P3";
  const createdDate = idea["Created-Date"] ?? "";

  return {
    id,
    title: extractTitle(idea.content, id),
    business,
    status,
    priority,
    location: inferLocation(idea.filePath),
    createdDate,
    tags: idea.Tags ?? [],
  };
}
