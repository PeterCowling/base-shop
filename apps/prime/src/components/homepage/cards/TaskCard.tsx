/**
 * TaskCard.tsx
 *
 * A reusable task card component for the homepage DoList.
 * Shows different layouts for incomplete vs completed tasks.
 */

import { CheckCircle } from 'lucide-react';
import { memo } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/router';
import { Inline, Stack } from '@acme/ui';

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
      <Stack
        asChild
        gap={4}
        className="
          w-full
          border border-gray-200
          rounded-lg
          overflow-hidden
          bg-white
          transition-all duration-300
          text-start
          hover:-translate-y-1
          hover:shadow-lg
          cursor-pointer
        "
      >
        <div>
        {/* Title Section */}
        <h3 className="text-xl mt-3 mx-4 mb-2 text-gray-800 text-center">
          {link ? (
            <Link
              to={link}
              className="text-blue-600 no-underline transition-colors duration-300 hover:text-blue-800"
            >
              {title}
            </Link>
          ) : (
            <span className="text-gray-800">{title}</span>
          )}
        </h3>

        {/* Content Section (Image and Note) */}
        {(image || note) && (
          <Stack align="center" gap={4} className="p-4 pt-0 w-full">
            {image &&
              (link ? (
                <Link to={link}>
                  <Image
                    src={image}
                    alt={alt || ''}
                    width={200}
                    height={140}
                    className="h-auto w-48 rounded object-cover"
                  />
                </Link>
              ) : (
                <Image
                  src={image}
                  alt={alt || ''}
                  width={200}
                  height={140}
                  className="h-auto w-48 rounded object-cover"
                />
              ))}
            {note && (
              <p className="w-full text-gray-600 text-base text-center">
                {note}
              </p>
            )}
          </Stack>
        )}
        </div>
      </Stack>
    );
  }

  // --- Rendering Logic for COMPLETED state ---
  return (
    <Stack
      align="start"
      gap={2}
      className="
        bg-white border border-gray-300 rounded-md
        px-5 py-4
        shadow-sm
        transition-all duration-300
        cursor-default
      "
    >
      <Inline gap={3} wrap={false} className="w-full">
        {/* Checkmark for completed */}
        <span className="text-green-600 text-xl">
          <CheckCircle />
        </span>

        {/* Completed Title */}
        <span className="text-lg font-semibold text-green-600">
          {displayCompletedTitle}
        </span>
      </Inline>
    </Stack>
  );
});

export default TaskCard;
