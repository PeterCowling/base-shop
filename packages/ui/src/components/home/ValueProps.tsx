// src/components/home/ValueProps.tsx
import { useTranslations } from "@acme/i18n";
import { memo } from "react";

export type ValuePropItem = { icon: string; title: string; desc: string };

function ValuePropsInner({ items = [] }: { items?: ValuePropItem[] }) {
  const t = useTranslations();

  const defaultItems = [
    {
      icon: "🌱",
      title: t("value.eco.title"),
      desc: t("value.eco.desc"),
    },
    {
      icon: "🚚",
      title: t("value.ship.title"),
      desc: t("value.ship.desc"),
    },
    {
      icon: "↩️",
      title: t("value.return.title"),
      desc: t("value.return.desc"),
    },
  ];

  const data = items.length ? items : defaultItems;

  return (
    <section className="mx-auto grid max-w-6xl gap-2 px-4 py-4 sm:grid-cols-3">
      {" "}
      {data.map(({ icon, title, desc }) => (
        <article key={String(title)} className="text-center">
          <div className="mb-4 text-4xl">{icon}</div>
          <h3 className="mb-2 text-xl font-semibold">{title}</h3>
          <p className="text-muted" data-token="--color-muted">{desc}</p>
        </article>
      ))}
    </section>
  );
}

export const ValueProps = memo(ValuePropsInner);
export default ValueProps;
