/**
 * ServiceCard.tsx
 *
 * A reusable card for displaying services on the homepage.
 * Supports horizontal layout (default) and vertical layout (image stacked above text).
 */

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Card } from '@acme/design-system/primitives';

export interface ServiceCardProps {
  title: string;
  alt?: string;
  description?: string;
  to: string;
  image?: string;
  layout?: 'horizontal' | 'vertical';
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
  layout = 'horizontal',
}: ServiceCardProps) {
  return (
    <Card
      className="
        w-full
        overflow-hidden
        transition-transform duration-300
        flex flex-col
        text-start
        ms-4
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

      <div
        className={`${layout === 'vertical' ? 'flex flex-col items-center' : 'flex flex-row items-center'} p-4 w-full gap-4`}
      >
        {image && (
          <Link href={to}>
            <Image
              src={image}
              alt={alt || ''}
              width={200}
              height={200}
              className="w-48 object-cover rounded"
              unoptimized
            />
          </Link>
        )}
        {description && (
          <p className={`w-full text-muted-foreground text-base${layout === 'horizontal' ? ' px-4' : ''}`}>
            {description}
          </p>
        )}
      </div>
    </Card>
  );
});

export default ServiceCard;
