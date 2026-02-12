import type { Priority } from "@/lib/types";

export type IdeaListItem = {
  id: string;
  title: string;
  business: string;
  status: "raw" | "worked" | "converted" | "dropped";
  priority: Priority;
  location: "inbox" | "worked";
  createdDate: string;
  tags: string[];
};
