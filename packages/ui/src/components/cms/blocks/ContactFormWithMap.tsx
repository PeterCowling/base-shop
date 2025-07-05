"use client";
import ContactForm from "./ContactForm";

export default function ContactFormWithMap({
  mapSrc = "https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed",
}: {
  mapSrc?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ContactForm />
      <iframe
        src={mapSrc}
        title="map"
        className="min-h-[300px] w-full rounded"
        loading="lazy"
      />
    </div>
  );
}
