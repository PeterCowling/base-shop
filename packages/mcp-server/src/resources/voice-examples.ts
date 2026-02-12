import { readFile } from "fs/promises";
import { join } from "path";

import { DATA_ROOT } from "../utils/data-root.js";

import { clearBriketteCache } from "./brikette-knowledge.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; expires: number }>();

async function loadCached<T>(uri: string, loader: () => Promise<T>): Promise<T> {
  const cached = cache.get(uri);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  const data = await loader();
  cache.set(uri, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

export const voiceExamplesResourceDefinition = {
  uri: "brikette://voice-examples",
  name: "Voice/Tone Examples",
  description: "Voice and tone examples for Brikette email drafts",
  mimeType: "application/json",
};

export function clearVoiceExamplesCache(): void {
  cache.clear();
  clearBriketteCache();
}

export async function handleVoiceExamplesRead() {
  const data = await loadCached(voiceExamplesResourceDefinition.uri, async () => {
    const content = await readFile(join(DATA_ROOT, "voice-examples.json"), "utf-8");
    return JSON.parse(content);
  });

  return {
    contents: [
      {
        uri: voiceExamplesResourceDefinition.uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
