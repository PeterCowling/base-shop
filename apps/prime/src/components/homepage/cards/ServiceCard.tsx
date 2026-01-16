/**
 * ServiceCard.tsx
 *
 * A reusable card for displaying services on the homepage.
 * Horizontal layout with image on one side and description on the other.
 */

import { memo } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/router';
import { Inline, Stack } from '@acme/ui';

export interface ServiceCardProps {
  title: string;
  alt?: string;
  description?: string;
  to: string;
  image?: string;
}

/**
 * ServiceCard (UI Component)
 * Displays a heading, an image, and a description,
 * linking to a service route.
 */
export const ServiceCard = memo(function ServiceCard({
  title,
  alt,
  description,
  to,
  image,
}: ServiceCardProps) {
  return (
    <Stack
      asChild
      gap={4}
      className="
        w-full
        border border-gray-200
        rounded-lg
        overflow-hidden
        bg-white
        transition-transform duration-300
        text-start
        ms-4
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      <div>
      <h3 className="text-xl mt-3 mx-4 mb-2 text-gray-800 text-center">
        <Link
          to={to}
          className="text-blue-600 no-underline transition-colors duration-300 hover:text-blue-800"
        >
          {title}
        </Link>
      </h3>

        <Inline gap={4} className="p-4 w-full">
          {image && (
            <Link to={to}>
              <Image
                src={image}
                alt={alt || ''}
                width={200}
                height={140}
                className="h-auto w-48 rounded object-cover"
              />
            </Link>
          )}
          {description && (
            <p className="w-full px-4 text-gray-600 text-base">
              {description}
            </p>
          )}
        </Inline>
      </div>
    </Stack>
  );
});

export default ServiceCard;
