import { Trans } from "react-i18next";
import type { TFunction } from "i18next";

import { Grid } from "@acme/ui/atoms/Grid";
import { AppLink } from "@acme/ui/atoms/Link";

import { IntroHighlightCard } from "../IntroHighlightCard";
import { SEA_HORSE_SHUTTLE_URL, externalLinkClass } from "../styles";

export type IntroHighlightsProps = {
  t: TFunction<"howToGetHere">;
  introKey: string;
  taxiEyebrow: string;
  taxiContact: string;
  shuttleEyebrow: string;
};

export function IntroHighlights({ t, introKey, taxiEyebrow, taxiContact, shuttleEyebrow }: IntroHighlightsProps) {
  return (
    <div className="rounded-3xl bg-brand-secondary px-6 py-8 text-brand-heading shadow-sm dark:bg-brand-secondary">
      <Grid gap={6} columns={{ base: 1, lg: 2 }} className="text-base leading-relaxed">
        <IntroHighlightCard eyebrow={taxiEyebrow}>
          <Trans
            i18nKey={`${introKey}.taxi`}
            t={t}
            components={{ Strong: <span className="font-semibold" /> }}
            values={{ contact: taxiContact }}
          />
        </IntroHighlightCard>
        <IntroHighlightCard eyebrow={shuttleEyebrow}>
          <Trans
            i18nKey={`${introKey}.shuttle`}
            t={t}
            components={{
              Link: (
                <AppLink
                  className={externalLinkClass}
                  href={SEA_HORSE_SHUTTLE_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              ),
            }}
          />
        </IntroHighlightCard>
      </Grid>
    </div>
  );
}
