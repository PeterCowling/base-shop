// src/components/home/ValueProps.tsx
import { useTranslations } from "@/i18n/Translations";
import { memo } from "react";

function ValuePropsInner() {
  const t = useTranslations();

  const items = [
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

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3">
      {items.map(({ icon, title, desc }) => (
        <article key={title} className="text-center">
          <div className="mb-4 text-4xl">{icon}</div>
          <h3 className="mb-2 text-xl font-semibold">{title}</h3>
          <p className="text-gray-600">{desc}</p>
        </article>
      ))}
    </section>
  );
}

export const ValueProps = memo(ValuePropsInner);
export default ValueProps;
