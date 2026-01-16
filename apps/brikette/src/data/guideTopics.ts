// src/data/guideTopics.ts
import type { GuideMeta } from "@/data/guides.index";

export type GuideTopic = {
  id: string;
  tags: readonly string[];
};

const TOPICS: readonly GuideTopic[] = [
  { id: "beaches", tags: ["beaches"] },
  { id: "hiking", tags: ["hiking"] },
  { id: "cuisine", tags: ["cuisine"] },
  { id: "day-trip", tags: ["day-trip"] },
  { id: "boat", tags: ["boat"] },
  { id: "transport", tags: ["transport", "bus", "ferry", "train", "car", "passes"] },
  { id: "itinerary", tags: ["itinerary"] },
  { id: "photography", tags: ["photography"] },
  { id: "culture", tags: ["culture", "event", "events", "seasonal"] },
] as const;

const normalize = (value: string): string => value.trim().toLowerCase();

export const GUIDE_TOPICS: readonly GuideTopic[] = TOPICS.map((topic) => ({
  id: normalize(topic.id),
  tags: topic.tags.map(normalize),
}));

const TOPIC_BY_ID = new Map(GUIDE_TOPICS.map((topic) => [topic.id, topic]));
const TOPIC_IDS = new Set(GUIDE_TOPICS.map((topic) => topic.id));
const TAG_TO_TOPICS = (() => {
  const map = new Map<string, string[]>();
  for (const topic of GUIDE_TOPICS) {
    for (const tag of topic.tags) {
      const existing = map.get(tag);
      if (existing) {
        existing.push(topic.id);
      } else {
        map.set(tag, [topic.id]);
      }
    }
  }
  return map;
})();

export const resolveGuideTopicId = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = normalize(value);
  if (!normalized) return null;
  if (TOPIC_IDS.has(normalized)) return normalized;
  const matches = TAG_TO_TOPICS.get(normalized);
  return matches?.[0] ?? null;
};

export const matchesGuideTopic = (guide: GuideMeta, topicId: string): boolean => {
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) return false;
  return guide.tags.some((tag) => topic.tags.includes(tag.toLowerCase()));
};