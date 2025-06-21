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
    <section className="grid gap-8 sm:grid-cols-3 py-16 max-w-6xl mx-auto px-4">
      {items.map(({ icon, title, desc }) => (
        <article key={title} className="text-center">
          <div className="text-4xl mb-4">{icon}</div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600">{desc}</p>
        </article>
      ))}
    </section>
  );
}

export const ValueProps = memo(ValuePropsInner);
