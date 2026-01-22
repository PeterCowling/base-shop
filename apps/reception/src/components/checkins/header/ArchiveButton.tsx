/* File: src/components/checkins/header/ArchiveButton.tsx */
import { type FC, memo, type MouseEventHandler } from "react";

/**
 * This component renders a small archive icon button.
 * It matches the size and general style of DeleteButton but uses
 * a yellow theme to indicate archiving.
 *
 * How to avoid breaking other code:
 * - Keep the interface strictly typed.
 * - Pass all event handlers or styling overrides via props.
 * - This is a standalone, reusable component.
 */
interface ArchiveButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  /** Number of guest records eligible for archiving */
  eligibleCount?: number;
}

const ArchiveButton: FC<ArchiveButtonProps> = ({ onClick, eligibleCount }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center border border-yellow-400 rounded-md p-1 hover:bg-yellow-100 active:bg-yellow-200"
      aria-label="Archive"
    >
      {/* Archive icon (24x24) */}
      <svg
        className="w-6 h-6 text-yellow-700"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 4h18v4H3V4zM5 8h14v11a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm7 5v4m0 0l2-2m-2 2l-2-2"
        />
      </svg>
      {typeof eligibleCount === "number" && (
        <span className="ms-1 text-sm text-yellow-700">{`Archive (${eligibleCount})`}</span>
      )}
    </button>
  );
};

export default memo(ArchiveButton);
