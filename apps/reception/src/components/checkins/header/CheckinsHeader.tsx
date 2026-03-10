// src/components/checkins/header/CheckinsHeader.tsx

import { type FC, type MouseEventHandler } from "react";

import { Inline } from "@acme/design-system/primitives";

import { useAuth } from "../../../context/AuthContext";
import { canAccess, Permissions } from "../../../lib/roles";

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
    <div className="flex items-center justify-between mb-6">
      {/* Title with green accent bar */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-primary-main" aria-hidden="true" />
        <h1 className="text-2xl font-heading font-semibold text-foreground tracking-wide">
          Check-ins
        </h1>
      </div>
      {/* Action buttons only for users with bulk-action access */}
      <Inline wrap={false} gap={0} className="justify-end space-x-2">
        {canAccess(user ?? null, Permissions.BULK_ACTIONS) && (
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
      </Inline>
    </div>
  );
};

export default CheckinsHeader;
