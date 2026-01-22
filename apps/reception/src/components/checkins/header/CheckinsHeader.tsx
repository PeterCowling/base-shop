// src/components/checkins/header/CheckinsHeader.tsx

import { type FC, type MouseEventHandler } from "react";

import { useAuth } from "../../../context/AuthContext";

import ArchiveButton from "./ArchiveButton";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import NewBookingButton from "./NewBookingButton";

/**
 * CheckinsHeader renders a header row with the "CHECKINS" title centered.
 * The NewBookingButton, EditButton, and DeleteButton are conditionally rendered
 * and are only included if the authenticated user's name is "Pete".
 *
 * How to avoid breaking other code:
 * - The left grid cell is intentionally left blank so the title remains centered.
 * - The right grid cell maintains layout consistency.
 * - All event handlers are passed via props.
 */
interface CheckinsHeaderProps {
  onNewBookingClick: MouseEventHandler<HTMLButtonElement>;
  onEditClick: MouseEventHandler<HTMLButtonElement>;
  onDeleteClick: MouseEventHandler<HTMLButtonElement>;
  onArchiveClick: MouseEventHandler<HTMLButtonElement>;
  /** Number of guest records eligible for archiving */
  eligibleCount: number;
}

const CheckinsHeader: FC<CheckinsHeaderProps> = ({
  onNewBookingClick,
  onEditClick,
  onDeleteClick,
  onArchiveClick,
  eligibleCount,
}) => {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-3 items-center mb-6">
      {/* Left cell intentionally left blank */}
      <div />
      {/* Center cell with title */}
      <h1 className="text-5xl font-heading text-primary-main text-center">
        CHECKINS
      </h1>
      {/* Right cell with booking, edit, and delete buttons only if user is "Pete" */}
      <div className="flex justify-end pr-[20px] space-x-2">
        {user?.user_name === "Pete" && (
          <>
            <NewBookingButton onClick={onNewBookingClick} />
            <EditButton onClick={onEditClick} />
            <DeleteButton onClick={onDeleteClick} />
            <ArchiveButton
              onClick={onArchiveClick}
              eligibleCount={eligibleCount}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CheckinsHeader;
