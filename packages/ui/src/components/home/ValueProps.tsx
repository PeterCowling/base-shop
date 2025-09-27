// src/components/home/ValueProps.tsx
import { useTranslations } from "@acme/i18n";
import { memo } from "react";
import { Grid } from "../atoms/primitives";

export type ValuePropItem = { icon: string; title: string; desc: string };

function ValuePropsInner({ items = [] }: { items?: ValuePropItem[] }) {
  const t = useTranslations();

  const defaultItems = [
    {
      icon: "🌱", // i18n-exempt: emoji icon
      title: t("value.eco.title"),
      desc: t("value.eco.desc"),
    },
    {
      icon: "🚚", // i18n-exempt: emoji icon
      title: t("value.ship.title"),
      desc: t("value.ship.desc"),
    },
    {
      icon: "↩️", // i18n-exempt: emoji icon
      title: t("value.return.title"),
      desc: t("value.return.desc"),
    },
  ];

  const data = items.length ? items : defaultItems;

  return (
    <section className="mx-auto px-4 py-4">
      <Grid cols={3} gap={2}>
        {data.map(({ icon, title, desc }) => (
          <article key={String(title)} className="text-center">
            <div className="mb-4 text-4xl">{icon}</div>
            <h3 className="mb-2 text-xl font-semibold">{title}</h3>
            {(() => {
              const textMuted = "text-muted"; // i18n-exempt: CSS class name only
              const tokenMuted = "--color-muted"; // i18n-exempt: design token name
              return (
                <p className={textMuted} data-token={tokenMuted}>
                  {desc}
                </p>
              );
            })()}
          </article>
        ))}
      </Grid>
    </section>
  );
}

export const ValueProps = memo(ValuePropsInner);
export default ValueProps;
