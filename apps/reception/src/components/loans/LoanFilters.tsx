import { memo, type ReactElement } from "react";

import DateSelector from "./DateSel";

interface LoanFiltersProps {
  username: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  guestFilter: string;
  onGuestFilterChange: (value: string) => void;
}

function LoanFiltersComponent({
  username,
  selectedDate,
  onDateChange,
  guestFilter,
  onGuestFilterChange,
}: LoanFiltersProps): ReactElement {
  return (
    <div className="space-y-4 dark:text-darkAccentGreen">
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        username={username}
      />
      <div className="flex items-center gap-2">
        <label htmlFor="guestFilter" className="font-semibold dark:text-darkAccentGreen">
          Filter by guest name:
        </label>
        <input
          id="guestFilter"
          type="text"
          value={guestFilter}
          onChange={(e) => onGuestFilterChange(e.target.value)}
          className="border rounded px-2 py-1 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          placeholder="Type a name..."
        />
      </div>
    </div>
  );
}

export const LoanFilters = memo(LoanFiltersComponent);
export default LoanFilters;
