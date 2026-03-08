import "server-only";

import { getDraftGuideData } from "./data.server";

export const draftGuideResourceDefinition = {
  uri: "brikette://draft-guide",
  name: "Draft Quality Guide",
  description: "Draft quality framework for Brikette email responses",
  mimeType: "application/json",
} as const;

export function clearDraftGuideCache(): void {
  // Static JSON imports are already immutable and cached by the module system.
}

export async function handleDraftGuideRead() {
  const data = getDraftGuideData();

  return {
    contents: [
      {
        uri: draftGuideResourceDefinition.uri,
        mimeType: draftGuideResourceDefinition.mimeType,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
