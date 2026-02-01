import type { Business } from "./types";

// TODO (BOS-D1-08): Move businesses to D1 table (or derive from cards)
// Temporary hard-coded business catalog (mirrors docs/business-os/strategy/businesses.json)
export const BUSINESSES: Business[] = [
  {
    id: "PLAT",
    name: "Platform",
    description:
      "Core platform infrastructure, shared services, and developer experience",
    owner: "Pete",
    status: "active",
    created: "2026-01-28",
    tags: ["infrastructure", "dx", "monorepo"],
  },
  {
    id: "BRIK",
    name: "Brikette",
    description:
      "Multilingual e-commerce platform for hostel bookings and travel experiences",
    owner: "Pete",
    status: "active",
    created: "2026-01-28",
    tags: ["e-commerce", "travel", "i18n"],
  },
  {
    id: "BOS",
    name: "Business OS",
    description:
      "Repo-native business operating system and kanban coordination layer",
    owner: "Pete",
    status: "active",
    created: "2026-01-28",
    tags: ["workflow", "coordination", "agents"],
  },
];

export const BUSINESS_CODES = BUSINESSES.map((business) => business.id);

