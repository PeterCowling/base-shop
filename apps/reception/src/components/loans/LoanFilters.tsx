import { memo, type ReactElement } from "react";

import { Input } from "@acme/design-system";

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
    <div className="space-y-4">
      <DateSelector
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        username={username}
      />
      <div className="flex items-center gap-2">
        <label htmlFor="guestFilter" className="font-semibold">
          Filter by guest name:
        </label>
        <Input compatibilityMode="no-wrapper"
          id="guestFilter"
          type="text"
          value={guestFilter}
          onChange={(e) => onGuestFilterChange(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Type a name..."
        />
      </div>
    </div>
  );
}

export const LoanFilters = memo(LoanFiltersComponent);
export default LoanFilters;
