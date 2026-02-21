// packages/ui/src/organisms/ApartmentAmenitiesSection.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Bath, Maximize2, Snowflake, Utensils, WashingMachine, Wifi } from "lucide-react";

import { CfImage } from "../atoms/CfImage";

const AMENITY_ICONS = [Wifi, Utensils, Snowflake, WashingMachine, Bath, Maximize2] as const;
const AMENITIES_IMAGE_SRC = "/img/725818368.jpg";

const ApartmentAmenitiesSection = ({ lang }: { lang?: string }): JSX.Element => {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  const raw = t("amenitiesList", { returnObjects: true });
  const items = Array.isArray(raw) ? (raw as string[]) : [];
  return (
    <section aria-labelledby="amenities-heading">
      <div className="space-y-6">
        <h2
          id={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] id attribute */ "amenities-heading"}
          className={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "text-xl font-semibold text-brand-heading"}
        >
          {t("amenitiesHeading")}
        </h2>
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-md">
            <CfImage
              src={AMENITIES_IMAGE_SRC}
              alt={t("amenitiesImageAlt")}
              width={800}
              height={600}
              preset="hero"
              className="w-full"
            />
          </div>
          <ul className="space-y-3 text-start">
            {items.map((item, index) => {
              const Icon = AMENITY_ICONS[index] ?? null;
              return (
                <li key={item} className="flex items-center space-x-3">
                  {Icon && <Icon size={18} className="shrink-0 text-brand-primary" aria-hidden />}
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default memo(ApartmentAmenitiesSection);
export { ApartmentAmenitiesSection };
