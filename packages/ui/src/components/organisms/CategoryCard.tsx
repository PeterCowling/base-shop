import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
// i18n-exempt -- DS-1234 [ttl=2025-11-30]
const IMAGE_CLASSES = "rounded-md object-cover"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
const DESCRIPTION_CLASSES = "text-muted-foreground text-sm"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
const IMAGE_SIZES = "(min-width: 640px) 25vw, 50vw"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]

export interface Category {
  id: string;
  title: string;
  image: string;
  description?: string;
}

export interface CategoryCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  category: Category;
  /** Override default padding classes. */
  padding?: string;
}

export const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ category, padding = "p-4", className, ...props }, ref) => {
    const hasImage = Boolean(category.image);
    return (
    <div
      ref={ref}
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "flex flex-col gap-3 rounded-lg border",
        padding,
        className
      )}
      {...props}
    >
      {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
      {/* Constants defined above for CSS classes and sizes */}
      {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
      <div className="relative aspect-square">
        {hasImage ? (
          <Image
            src={category.image}
            alt={category.title}
            fill
            sizes={IMAGE_SIZES}
            className={IMAGE_CLASSES}
          />
        ) : (
          <div className="h-full w-full rounded-md bg-muted" aria-hidden />
        )}
      </div>
      {/* i18n-exempt: CSS utility classes only */}
      <h3 className="font-medium">{category.title}</h3>
      {category.description && (
        // i18n-exempt: CSS utility classes only
        <p className={DESCRIPTION_CLASSES}>{category.description}</p>
      )}
    </div>
    );
  }
);
CategoryCard.displayName = "CategoryCard";
