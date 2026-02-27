/**
 * TaskCard.tsx
 *
 * A reusable task card component for the homepage DoList.
 * Shows different layouts for incomplete vs completed tasks.
 */

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { Card } from '@acme/design-system/primitives';

export interface TaskCardProps {
  title: string;
  completedTitle?: string;
  note?: string;
  image?: string;
  alt?: string;
  link?: string;
  completed?: boolean;
}

/**
 * TaskCard (UI Component)
 * - If incomplete: Renders with centered title, image, note, and link
 * - If complete: Renders with a checkmark and title
 */
export const TaskCard = memo(function TaskCard({
  title,
  completedTitle,
  note,
  image,
  alt,
  link,
  completed = false,
}: TaskCardProps) {
  // Decide which title to display when completed
  const displayCompletedTitle =
    completed && completedTitle ? completedTitle : title;

  // --- Rendering Logic for INCOMPLETE state ---
  if (!completed) {
    return (
      <Card
        className="
          w-full
          overflow-hidden
          transition-all duration-300
          flex flex-col
          text-start
          hover:-translate-y-1
          hover:shadow-lg
          cursor-pointer
        "
      >
        {/* Title Section */}
        <h3 className="text-xl mt-3 mx-4 mb-2 text-foreground text-center">
          {link ? (
            <Link
              href={link}
              className="text-primary no-underline transition-colors duration-300 hover:text-primary-hover"
            >
              {title}
            </Link>
          ) : (
            <span className="text-foreground">{title}</span>
          )}
        </h3>

        {/* Content Section (Image and Note) */}
        {(image || note) && (
          <div className="flex flex-col items-center p-4 pt-0 gap-4 w-full">
            {image &&
              (link ? (
                <Link href={link}>
                  <Image
                    src={image}
                    alt={alt || ''}
                    width={200}
                    height={200}
                    className="max-w-48 object-cover rounded"
                    unoptimized
                  />
                </Link>
              ) : (
                <>
                  <Image
                    src={image}
                    alt={alt || ''}
                    width={200}
                    height={200}
                    className="max-w-48 object-cover rounded"
                    unoptimized
                  />
                </>
              ))}
            {note && (
              <p className="w-full text-muted-foreground text-base text-center">
                {note}
              </p>
            )}
          </div>
        )}
      </Card>
    );
  }

  // --- Rendering Logic for COMPLETED state ---
  return (
    <Card
      className="
        flex flex-col items-start
        px-5 py-4
        transition-all duration-300
        cursor-default
      "
    >
      <div className="flex items-center w-full">
        {/* Checkmark for completed */}
        <span className="text-success text-xl me-3 flex items-center">
          <CheckCircle />
        </span>

        {/* Completed Title */}
        <span className="text-lg font-semibold text-success">
          {displayCompletedTitle}
        </span>
      </div>
    </Card>
  );
});

export default TaskCard;
