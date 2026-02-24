/* eslint-disable ds/no-hardcoded-copy -- server-side business data catalog — internal labels, not customer-facing UI copy [DS-02] */
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
    category: "internal-system",
    status: "active",
    created: "2026-01-28",
    tags: ["infrastructure", "dx", "monorepo"],
    apps: [
      "platform-core",
      "design-system",
      "mcp-server",
      "front-door-worker",
      "api",
      "cms",
      "dashboard",
      "storybook",
      "telemetry-worker",
      "checkout-gateway-worker",
    ],
  },
  {
    id: "BRIK",
    name: "Brikette",
    description:
      "Multilingual e-commerce platform for hostel bookings and travel experiences",
    owner: "Pete",
    category: "operating-business",
    status: "active",
    created: "2026-01-28",
    tags: ["e-commerce", "travel", "i18n"],
    apps: ["brikette", "brikette-scripts", "reception", "prime"],
  },
  {
    id: "BOS",
    name: "Business OS",
    description:
      "Repo-native business operating system and kanban coordination layer",
    owner: "Pete",
    category: "internal-system",
    status: "active",
    created: "2026-01-28",
    tags: ["workflow", "coordination", "agents"],
    apps: ["business-os"],
  },
  {
    id: "PIPE",
    name: "Product Pipeline",
    description: "China sourcing to EU multi-channel capital return pipeline",
    owner: "Pete",
    category: "operating-business",
    status: "active",
    created: "2026-01-31",
    tags: ["commerce", "sourcing", "automation"],
    apps: ["product-pipeline", "product-pipeline-queue-worker"],
  },
  {
    id: "XA",
    name: "XA",
    description:
      "Standalone XA business stream for brand and channel-specific execution",
    owner: "Pete",
    category: "operating-business",
    status: "active",
    created: "2026-02-11",
    tags: ["commerce", "brand", "execution"],
    apps: ["xa", "xa-uploader"],
  },
  {
    id: "HEAD",
    name: "Headband",
    description: "Headband-focused product business with dedicated outcomes",
    owner: "Pete",
    category: "operating-business",
    status: "active",
    created: "2026-02-11",
    tags: ["product", "accessories", "consumer"],
    apps: ["cochlearfit", "cochlearfit-worker"],
  },
  {
    id: "PET",
    name: "Pet Product",
    description:
      "Pet product business stream with dedicated market and operations planning",
    owner: "Pete",
    category: "operating-business",
    status: "active",
    created: "2026-02-11",
    tags: ["pet", "product", "consumer"],
    apps: [],
  },
  {
    id: "HBAG",
    name: "Handbag Accessory",
    description:
      "Handbag accessory business stream tracked separately from XA",
    owner: "Pete",
    category: "operating-business",
    status: "active",
    created: "2026-02-11",
    tags: ["fashion", "accessories", "consumer"],
    apps: ["cover-me-pretty", "handbag-configurator", "handbag-configurator-api", "caryina"],
  },
];

export const BUSINESS_CODES = BUSINESSES.map((business) => business.id);
