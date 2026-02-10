/**
 * ServiceCard2.tsx
 *
 * Variant of ServiceCard with vertical layout.
 * Image stacked above the description.
 */

import { memo } from 'react';
import Link from 'next/link';

import { Card } from '@acme/design-system/primitives';

export interface ServiceCardProps {
  title: string;
  alt?: string;
  description?: string;
  to: string;
  image?: string;
}

/**
 * ServiceCard2 (UI Component)
 * Displays a heading, an image, and a description in vertical layout,
 * linking to a service route.
 */
export const ServiceCard2 = memo(function ServiceCard2({
  title,
  alt,
  description,
  to,
  image,
}: ServiceCardProps) {
  return (
    <Card
      className="
        w-full max-w-[370px]
        overflow-hidden
        transition-transform duration-300
        flex flex-col
        text-left
        ml-4
        hover:-translate-y-1
        hover:shadow-lg
      "
    >
      <h3 className="text-xl mt-3 mx-4 mb-2 text-foreground text-center">
        <Link
          href={to}
          className="text-primary no-underline transition-colors duration-300 hover:text-primary-hover"
        >
          {title}
        </Link>
      </h3>

      {/* Vertical layout: image stacked above text */}
      <div className="flex flex-col items-center p-4 gap-4 w-full">
        {image && (
          <Link href={to}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={alt || ''}
              className="max-w-[200px] h-auto object-cover rounded"
            />
          </Link>
        )}
        {description && (
          <p className="w-full text-muted-foreground text-base">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
});

export default ServiceCard2;
