import "server-only";

import {
  getBriketteKnowledgeSnapshot,
  type ReceptionKnowledgeResourceUri,
} from "./data.server";

export const briketteResourceDefinitions = [
  {
    uri: "brikette://faq",
    name: "Brikette FAQ",
    description: "Frequently asked questions about Hostel Brikette",
    mimeType: "application/json",
  },
  {
    uri: "brikette://rooms",
    name: "Room Details",
    description: "Room types, occupancy, amenities, and summary data for Hostel Brikette",
    mimeType: "application/json",
  },
  {
    uri: "brikette://pricing/menu",
    name: "Menu Pricing",
    description: "Current breakfast and bar menu pricing snapshot for Hostel Brikette",
    mimeType: "application/json",
  },
  {
    uri: "brikette://policies",
    name: "Policies",
    description: "Operational policies and FAQ-linked policy references for Hostel Brikette",
    mimeType: "application/json",
  },
] as const;

function isKnowledgeUri(uri: string): uri is ReceptionKnowledgeResourceUri {
  const snapshot = getBriketteKnowledgeSnapshot();
  return Object.prototype.hasOwnProperty.call(snapshot.resources, uri);
}

export function clearBriketteCache(): void {
  // Static JSON imports are already immutable and cached by the module system.
}

export async function handleBriketteResourceRead(uri: string) {
  if (!isKnowledgeUri(uri)) {
    throw new Error(`Unsupported Brikette knowledge resource: ${uri}`);
  }

  const snapshot = getBriketteKnowledgeSnapshot();
  const payload = snapshot.resources[uri];

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
