// packages/ui/src/organisms/ApartmentAmenitiesSection.tsx
import { CfImage } from "@/atoms/CfImage";
import { Snowflake, Utensils, WashingMachine, Wifi } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const AMENITY_ICONS = [Wifi, Utensils, Snowflake, WashingMachine] as const;
const AMENITIES_IMAGE_SRC = "/img/free-perks.avif";

const ApartmentAmenitiesSection = ({ lang }: { lang?: string }): JSX.Element => {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  const raw = t("amenitiesList", { returnObjects: true });
  const items = Array.isArray(raw) ? (raw as string[]) : [];
  return (
    <section aria-labelledby="amenities-heading" className="space-y-4">
      <h2
        id={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] id attribute */ "amenities-heading"}
        className={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "text-xl font-semibold text-brand-primary"}
      >
        {t("amenitiesHeading")}
      </h2>
      <CfImage
        src={AMENITIES_IMAGE_SRC}
        alt={t("amenitiesImageAlt")}
        width={800}
        height={600}
        preset="hero"
        className="h-auto w-full rounded-md object-cover"
      />
      <ul className="mx-auto space-y-2 text-start">
        {items.map((item, index) => {
          const Icon = AMENITY_ICONS[index] ?? null;
          return (
            <li key={item} className="flex items-start space-x-2">
              {Icon && <Icon size={18} className="mt-0.5 text-brand-primary" aria-hidden />}
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default memo(ApartmentAmenitiesSection);
export { ApartmentAmenitiesSection };
