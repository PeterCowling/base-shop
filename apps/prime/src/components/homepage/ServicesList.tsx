/**
 * ServicesList.tsx
 *
 * Renders a stylized section of service cards.
 * Fetches text content (title, description, alt) using i18next.
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ServiceCardData } from '../../config/homepage/servicesConfig';

import ServiceCard from './cards/ServiceCard';
import ServiceCard2 from './cards/ServiceCard2';

export interface ServicesListProps {
  services: ServiceCardData[];
  className?: string;
}

/**
 * ServicesList (UI Component)
 * Renders a stylized section of service cards.
 */
export const ServicesList = memo(function ServicesList({
  services,
  className = '',
}: ServicesListProps) {
  const { t } = useTranslation('Homepage');

  // Filter visible cards here if not pre-filtered by getServicesConfig
  const visibleServices = services.filter((card) => card.visible);

  // Only render if there is at least one visible service card
  if (!visibleServices || visibleServices.length === 0) {
    return null;
  }

  // Define ids that should use CardType2 (vertical layout)
  const cardType2Ids = new Set(['mainDoorService', 'digitalAssistantService']);

  return (
    <div className={className}>
      <h2 className="text-center text-2xl font-bold text-gray-800 mb-4">
        {t('ourServices')}
      </h2>
      <div className="flex flex-wrap justify-center gap-5">
        {visibleServices.map((card) => {
          const baseKey = `services.${card.id}`;
          const titleKey = `${baseKey}.title`;
          const descriptionKey = `${baseKey}.description`;
          const altKey = `${baseKey}.alt`;

          // Fetch translated text
          const title = t(titleKey);
          const description = t(descriptionKey);
          const alt = t(altKey, { defaultValue: title });

          // Determine which card component to use
          const CardComponent = cardType2Ids.has(card.id)
            ? ServiceCard2
            : ServiceCard;

          return (
            <CardComponent
              key={card.id}
              image={card.image}
              alt={alt}
              title={title}
              to={card.to}
              description={description}
            />
          );
        })}
      </div>
    </div>
  );
});

export default ServicesList;
