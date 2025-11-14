import { Grid } from "@/components/primitives/Grid";
import type { PersonDefinition } from "@/data/people";

type PeopleCardProps = {
  definition: PersonDefinition;
  translator: (key: string) => string;
  isZh: boolean;
};

const joinClasses = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function PeopleCard({ definition, translator, isZh }: PeopleCardProps) {
  const borderColor = isZh ? "border-accent/60" : "border-slate-200";
  const background = isZh ? "bg-zinc-900/80" : "bg-white/90";
  const textColor = isZh ? "text-zinc-100" : "text-slate-900";
  const accent = isZh ? "text-accent" : "text-slate-900";
  const wechatZh = ["border-accent/70", "bg-zinc-900/60", "text-zinc-100"];
  const wechatEn = ["border-slate-200", "bg-white/80", "text-slate-900"];

  return (
    <article
      className={`rounded-3xl border p-6 md:p-8 shadow-lg ${borderColor} ${background} ${textColor}`}
    >
      <div className="space-y-1">
        <p className="font-display text-3xl uppercase skylar-heading-tracking">
          {translator(definition.nameKey)}
        </p>
        {definition.secondaryNameKey && translator(definition.secondaryNameKey) && (
          <p className="text-sm text-zinc-200 skylar-secondary-tracking">
            {translator(definition.secondaryNameKey)}
          </p>
        )}
        <p
          className={`uppercase skylar-caption ${
            isZh ? "text-zinc-200/70" : "text-slate-500"
          }`}
        >
          {translator(definition.titleKey)}
        </p>
        {definition.subtitleKey && (
          <p className="font-body text-sm leading-6 text-zinc-400">
            {translator(definition.subtitleKey)}
          </p>
        )}
        {definition.cardLineKey && translator(definition.cardLineKey) && (
          <p className={`skylar-caption ${accent}`}>
            {translator(definition.cardLineKey)}
          </p>
        )}
      </div>
      <div className="mt-6 space-y-3">
        {definition.summaryKeys.map((key) => (
          <p key={key} className="font-body text-sm uppercase skylar-subheading-tracking">
            {translator(key)}
          </p>
        ))}
      </div>
      <Grid cols={1} gap={3} className="mt-8 skylar-caption md:grid-cols-3">
        {[
          {
            labelKey: definition.contact.phoneLabelKey,
            valueKey: definition.contact.phoneValueKey,
          },
          {
            labelKey: definition.contact.emailLabelKey,
            valueKey: definition.contact.emailValueKey,
          },
          {
            labelKey: definition.contact.websiteLabelKey,
            valueKey: definition.contact.websiteValueKey,
          },
        ].map((item, index) => (
          <div key={`${definition.key}-${index}`}>
            <p className="text-xs text-zinc-400">{translator(item.labelKey)}</p>
            <p className={`font-body ${isZh ? "text-zinc-100" : "text-slate-700"}`}>
              {translator(item.valueKey)}
            </p>
          </div>
        ))}
      </Grid>
      {definition.contact.wechatCaptionKey && definition.contact.wechatValueKey && (
        <div
          className={joinClasses(
            "mt-8",
            "rounded-2xl",
            "border",
            "px-4",
            "py-3",
            "text-sm",
            ...(isZh ? wechatZh : wechatEn)
          )}
        >
          <p className="skylar-caption text-zinc-400">
            {translator(definition.contact.wechatCaptionKey)}
          </p>
          <p className="font-body text-base leading-5">{translator(definition.contact.wechatValueKey)}</p>
        </div>
      )}
    </article>
  );
}
