/**
 * ServiceCard.tsx
 *
 * A reusable card for displaying services on the homepage.
 * Horizontal layout with image on one side and description on the other.
 */

import { memo } from 'react';
import { Link } from '@/lib/router';

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
    <div
      className="
        w-full max-w-[370px]
        border border-gray-200
        rounded-lg
        overflow-hidden
        bg-white
        transition-transform duration-300
        flex flex-col
        text-left
        ml-4
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      <h3 className="text-xl mt-3 mx-4 mb-2 text-gray-800 text-center">
        <Link
          to={to}
          className="text-blue-600 no-underline transition-colors duration-300 hover:text-blue-800"
        >
          {title}
        </Link>
      </h3>

      <div className="flex flex-row items-center p-4 w-full gap-4">
        {image && (
          <Link to={to}>
            <img
              src={image}
              alt={alt || ''}
              className="max-w-[200px] h-auto object-cover rounded"
            />
          </Link>
        )}
        {description && (
          <p className="w-full px-4 text-gray-600 text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});

export default ServiceCard;
