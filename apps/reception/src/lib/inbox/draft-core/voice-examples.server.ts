import "server-only";

import { getVoiceExamplesData } from "./data.server";

export const voiceExamplesResourceDefinition = {
  uri: "brikette://voice-examples",
  name: "Voice/Tone Examples",
  description: "Voice and tone examples for Brikette email drafts",
  mimeType: "application/json",
} as const;

export function clearVoiceExamplesCache(): void {
  // Static JSON imports are already immutable and cached by the module system.
}

export async function handleVoiceExamplesRead() {
  const data = getVoiceExamplesData();

  return {
    contents: [
      {
        uri: voiceExamplesResourceDefinition.uri,
        mimeType: voiceExamplesResourceDefinition.mimeType,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
