// src/routes/guides/cheapEatsInPositano/buildCheapEatsMeta.ts
import buildCfImageUrl from "@/lib/buildCfImageUrl";

import { HERO_IMAGE_PATH, type CheapEatsMetaData } from "./constants";

type BuildCheapEatsMetaParams = {
  title: string;
  description: string;
  breadcrumb: CheapEatsMetaData["breadcrumb"];
  itemListJson: string;
};

export function buildCheapEatsMeta({
  title,
  description,
  breadcrumb,
  itemListJson,
}: BuildCheapEatsMetaParams): CheapEatsMetaData {
  const hero = buildCfImageUrl(HERO_IMAGE_PATH, {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  });

  return {
    title,
    description,
    hero,
    breadcrumb,
    itemListJson,
  };
}
