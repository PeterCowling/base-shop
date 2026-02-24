// /src/components/bookingSearch/FilterBar.tsx
import React from "react";
import { Search } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

export interface FilterBarProps {
  firstName: string;
  lastName: string;
  bookingRef: string;
  status: string;
  nonRefundable: string;
  date: string;
  roomNumber: string;
  onFilterChange: (field: string, value: string) => void;
  onSearch: () => void;
  activityCodes: Record<number, string>;
}

const fieldStyles =
  "rounded-md border border-border-2 bg-surface px-3 py-2 text-sm shadow-sm " +
  "focus:outline-none focus:ring-2 focus:ring-ring";

const FilterBar: React.FC<FilterBarProps> = ({
  firstName,
  lastName,
  bookingRef,
  status,
  nonRefundable,
  date,
  roomNumber,
  onFilterChange,
  onSearch,
  activityCodes,
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSearch();
    }}
    className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-6"
  >
    {/* First Name */}
    <div className="flex flex-col">
      <label htmlFor="firstName" className="text-sm font-medium text-foreground">
        First Name
      </label>
      <input
        id="firstName"
        type="text"
        value={firstName}
        onChange={(e) => onFilterChange("firstName", e.target.value)}
        className={fieldStyles}
      />
    </div>

    {/* Last Name */}
    <div className="flex flex-col">
      <label htmlFor="lastName" className="text-sm font-medium text-foreground">
        Last Name
      </label>
      <input
        id="lastName"
        type="text"
        value={lastName}
        onChange={(e) => onFilterChange("lastName", e.target.value)}
        className={fieldStyles}
      />
    </div>

    {/* Booking Ref */}
    <div className="flex flex-col">
      <label htmlFor="bookingRef" className="text-sm font-medium text-foreground">
        Booking Ref
      </label>
      <input
        id="bookingRef"
        type="text"
        value={bookingRef}
        onChange={(e) => onFilterChange("bookingRef", e.target.value)}
        className={fieldStyles}
      />
    </div>

    {/* Activity Level */}
    <div className="flex flex-col">
      <label htmlFor="status" className="text-sm font-medium text-foreground">
        Activity Level
      </label>
      <select
        id="status"
        value={status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className={fieldStyles}
      >
        <option value="">All</option>
        {Object.entries(activityCodes).map(([code, text]) => (
          <option key={code} value={code}>
            {text}
          </option>
        ))}
      </select>
    </div>

    {/* Refundable Status */}
    <div className="flex flex-col">
      <label
        htmlFor="nonRefundable"
        className="text-sm font-medium text-foreground"
      >
        Refundable Status
      </label>
      <select
        id="nonRefundable"
        value={nonRefundable}
        onChange={(e) => onFilterChange("nonRefundable", e.target.value)}
        className={fieldStyles}
      >
        <option value="">All</option>
        <option value="true">Non-Refundable</option>
        <option value="false">Refundable</option>
      </select>
    </div>

    {/* Date */}
    <div className="flex flex-col">
      <label htmlFor="searchDate" className="text-sm font-medium text-foreground">
        Date
      </label>
      <input
        id="searchDate"
        type="date"
        value={date}
        onChange={(e) => onFilterChange("date", e.target.value)}
        className={fieldStyles}
      />
    </div>

    {/* Room Number */}
    <div className="flex flex-col">
      <label htmlFor="roomNumber" className="text-sm font-medium text-foreground">
        Room Number
      </label>
      <input
        id="roomNumber"
        type="text"
        value={roomNumber}
        onChange={(e) => onFilterChange("roomNumber", e.target.value)}
        className={fieldStyles}
      />
    </div>

    {/* Search Button (spans full width on small screens) */}
    <Button
      type="submit"
      className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary-main px-4 py-2 text-sm font-semibold text-primary-fg shadow-sm transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:col-span-3 lg:col-span-1"
    >
      <Search className="h-5 w-5" aria-hidden="true" />
      Search
    </Button>
  </form>
);

export default React.memo(FilterBar);
