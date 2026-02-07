import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import AssistanceArticleSection, { type MediaItem } from "./AssistanceArticleSection";

const DEFAULT_MEDIA = {
  busLook: "/img/interno1.webp",
  busLookExtra: "/img/interno2.webp",
  stopToHostel: "/img/tabacchi.webp",
  approach: "/img/arriving-at-hostel.webp",
} as const;

export type ArrivingByFerryMediaKey = keyof typeof DEFAULT_MEDIA;

export interface ArrivingByFerrySectionProps {
  readonly lang?: string;
  readonly namespace?: string;
  readonly mediaSources?: Partial<Record<ArrivingByFerryMediaKey, string>>;
}

const DEFAULT_NAMESPACE = "arrivingByFerry" as const;

function ArrivingByFerrySection({
  lang,
  namespace = DEFAULT_NAMESPACE,
  mediaSources,
}: ArrivingByFerrySectionProps): JSX.Element {
  const { t, ready } = useTranslation(namespace, { lng: lang });

  const media = useMemo(() => {
    const merged = { ...DEFAULT_MEDIA, ...mediaSources } as Record<ArrivingByFerryMediaKey, string>;
    const entries = Object.entries(merged) as Array<[ArrivingByFerryMediaKey, string]>;
    return entries.reduce<Record<string, MediaItem>>((acc, [key, src]) => {
      acc[key] = { src, alt: ready ? (t(`media.${key}.alt`) as string) : "" };
      return acc;
    }, {});
  }, [mediaSources, t, ready]);

  return <AssistanceArticleSection namespace={namespace} media={media} lang={lang} />;
}

export { DEFAULT_MEDIA as ARRIVING_BY_FERRY_MEDIA };
export default memo(ArrivingByFerrySection);
