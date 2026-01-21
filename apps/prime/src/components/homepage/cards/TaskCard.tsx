/**
 * TaskCard.tsx
 *
 * A reusable task card component for the homepage DoList.
 * Shows different layouts for incomplete vs completed tasks.
 */

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

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
      <div
        className="
          w-full
          border border-gray-200
          rounded-lg
          overflow-hidden
          bg-white
          transition-all duration-300
          flex flex-col
          text-left
          hover:-translate-y-1
          hover:shadow-lg
          cursor-pointer
        "
      >
        {/* Title Section */}
        <h3 className="text-xl mt-3 mx-4 mb-2 text-gray-800 text-center">
          {link ? (
            <Link
              href={link}
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
          <div className="flex flex-col items-center p-4 pt-0 gap-4 w-full">
            {image &&
              (link ? (
                <Link href={link}>
                  <img
                    src={image}
                    alt={alt || ''}
                    className="max-w-[200px] h-auto object-cover rounded"
                  />
                </Link>
              ) : (
                <img
                  src={image}
                  alt={alt || ''}
                  className="max-w-[200px] h-auto object-cover rounded"
                />
              ))}
            {note && (
              <p className="w-full text-gray-600 text-base text-center">
                {note}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Rendering Logic for COMPLETED state ---
  return (
    <div
      className="
        flex flex-col items-start
        bg-white border border-gray-300 rounded-md
        px-5 py-4
        shadow-sm
        transition-all duration-300
        cursor-default
      "
    >
      <div className="flex items-center w-full">
        {/* Checkmark for completed */}
        <span className="text-green-600 text-xl mr-3 flex items-center">
          <CheckCircle />
        </span>

        {/* Completed Title */}
        <span className="text-lg font-semibold text-green-600">
          {displayCompletedTitle}
        </span>
      </div>
    </div>
  );
});

export default TaskCard;
