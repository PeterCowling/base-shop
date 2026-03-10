/**
 * ServicesList.tsx
 *
 * Renders a stylized section of service cards.
 * Fetches text content (title, description, alt) using i18next.
 */

'use client';

import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ServiceCardData } from '../../config/homepage/servicesConfig';

import ServiceCard from './cards/ServiceCard';

// Static: IDs that use vertical card layout
const VERTICAL_CARD_IDS = new Set(['mainDoorService', 'digitalAssistantService']);

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
  const visibleServices = useMemo(
    () => services.filter((card) => card.visible),
    [services],
  );

  // Only render if there is at least one visible service card
  if (visibleServices.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h2 className="text-center text-2xl font-bold text-foreground mb-4">
        {t('ourServices')}
      </h2>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- BRIK-002 card grid container with dynamic children */}
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

          return (
            <ServiceCard
              key={card.id}
              image={card.image}
              alt={alt}
              title={title}
              to={card.to}
              description={description}
              layout={VERTICAL_CARD_IDS.has(card.id) ? 'vertical' : 'horizontal'}
            />
          );
        })}
      </div>
    </div>
  );
});

export default ServicesList;
