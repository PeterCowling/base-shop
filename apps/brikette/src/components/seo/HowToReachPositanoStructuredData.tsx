/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// /src/components/seo/HowToReachPositanoStructuredData.tsx
import { memo } from "react";
import { usePathname } from "next/navigation";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";

type StepContent = {
  name: string;
  text: string;
  image?: string;
  url?: string;
};

type HowToLocaleCopy = {
  name: string;
  steps: readonly StepContent[];
};

type ResolvedHowToCopy = {
  name: string;
  alternateName?: string;
  steps: readonly StepContent[];
  isFallback: boolean;
};

const HOW_TO_LOCALE_COPY = {
  en: {
    name: "Cheapest way to reach Positano from Naples Airport",
    steps: [
      {
        name: "Bus from Naples Airport to Sorrento",
        text: "Take the Curreri Viaggi shuttle (€10, 1 h 15 m) from outside arrivals to Sorrento train station.",
      },
      {
        name: "Coach from Sorrento to Positano",
        text: "At Sorrento, buy a €2.10 SITA CIS ticket and board the Positano‑Amalfi bus. Get off at Chiesa Nuova.",
      },
      {
        name: "Walk to Hostel Brikette",
        text: "Walk 80 m downhill (no stairs) to Hostel Brikette—look for the blue sign.",
      },
    ],
  },
  hu: {
    name: "Busz Nápoly repülőterétől Sorrentóba",
    steps: [
      {
        name: "Busz Nápoly repülőterétől Sorrentóba",
        text: "A Curreri Viaggi transzfer (≈10 €, 1 ó 15 p) közvetlenül a terminál elől indul, és a szorrentói vasútállomásig visz.",
      },
      {
        name: "Távolsági busz Sorrentóból Positanóba",
        text: "Sorrentóban vegyél SITA jegyet (≈2,10 €) a Positano–Amalfi járatra, és szállj le a Chiesa Nuova megállónál.",
      },
      {
        name: "Séta a Hostel Brikette-ig",
        text: "Innen kb. 80 m-t sétálj lejtőn, lépcsők nélkül – keresd a kék Hostel Brikette táblát.",
      },
    ],
  },
  ru: {
    name: "Автобус из аэропорта Неаполя в Сорренто",
    steps: [
      {
        name: "Автобус из аэропорта Неаполя в Сорренто",
        text:
          "Сядьте на шаттл Curreri Viaggi (≈10 €, 1 ч 15 м) от выхода из терминала до ж/д станции Сорренто.",
      },
      {
        name: "Междугородний автобус из Сорренто в Позитано",
        text:
          "В Сорренто купите билет SITA CIS (≈2,10 €) на автобус Positano–Amalfi и выйдите на остановке Chiesa Nuova.",
      },
      {
        name: "Прогулка до Hostel Brikette",
        text:
          "Пройдите примерно 80 м вниз по дороге (без лестниц) до Hostel Brikette — ищите синюю вывеску.",
      },
    ],
  },
  // …add seven more language keys (de, es, fr, it, ja, ko, pt, zh)
} as const satisfies Record<string, HowToLocaleCopy>;

type HowToLocale = keyof typeof HOW_TO_LOCALE_COPY;

const DEFAULT_LOCALE: HowToLocale = "en";
const DEFAULT_COPY = HOW_TO_LOCALE_COPY[DEFAULT_LOCALE];

const HOST_URL = "https://hostel-positano.com";

const hasOwn = <Obj extends Record<PropertyKey, unknown>, Key extends PropertyKey>(
  obj: Obj,
  key: Key
): key is Key & keyof Obj => Object.prototype.hasOwnProperty.call(obj, key);

function resolveHowToCopy(language: string): ResolvedHowToCopy {
  if (hasOwn(HOW_TO_LOCALE_COPY, language)) {
    const localized = HOW_TO_LOCALE_COPY[language];
    return {
      name: localized.name,
      steps: localized.steps,
      isFallback: false,
    };
  }

  return {
    name: DEFAULT_COPY.name,
    alternateName: DEFAULT_COPY.name,
    steps: DEFAULT_COPY.steps,
    isFallback: true,
  };
}

function HowToReachPositanoStructuredData(): JSX.Element {
  const lang = useCurrentLanguage(); // "en", "de", …
  const pathname = usePathname() ?? "";

  const { steps: localizedSteps, name, alternateName, isFallback } = resolveHowToCopy(lang);
  const steps = localizedSteps.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.name,
    text: s.text,
    ...(s.url ? { url: s.url } : {}),
    ...(s.image ? { image: s.image } : {}),
  }));

  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    inLanguage: lang,
    url: `${HOST_URL}${pathname}`,
    totalTime: "PT2H30M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: "12.10",
    },
    step: steps,
    name,
    ...(alternateName ? { alternateName } : {}),
    ...(isFallback
      ? {
          translationOfWork: {
            "@type": "CreativeWork",
            inLanguage: DEFAULT_LOCALE,
            name: DEFAULT_COPY.name,
          },
        }
      : {}),
  } satisfies Record<string, unknown>);

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default memo(HowToReachPositanoStructuredData);
