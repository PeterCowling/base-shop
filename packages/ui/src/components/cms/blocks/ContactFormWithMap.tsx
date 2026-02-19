"use client";
import { useTranslations } from "@acme/i18n";

import ContactForm from "./ContactForm";

export default function ContactFormWithMap({
  mapSrc = "https://www.google.com/maps/embed/v1/place?key=&q=Hostel+Brikette+Positano+Italy&zoom=13",
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
