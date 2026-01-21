"use client";
import { useTranslations } from "@acme/i18n";

import ContactForm from "./ContactForm";

export default function ContactFormWithMap({
  mapSrc = "https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed",
}: {
  mapSrc?: string;
}) {
  const t = useTranslations();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ContactForm />
      <iframe
        src={mapSrc}
        title={String(t("map.title"))}
        className="min-h-80 w-full rounded aspect-video"
        data-aspect="16/9"
        loading="lazy"
      />
    </div>
  );
}
