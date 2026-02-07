// /src/components/bookingSearch/FilterBar.tsx
import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

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
  "rounded-md border border-gray-400 bg-white px-3 py-2 text-sm shadow-sm " +
  "focus:outline-none focus:ring-2 focus:ring-primary-600 " +
  "dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen";

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
      <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
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
      <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
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
      <label htmlFor="bookingRef" className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
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
      <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
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
        className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen"
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
      <label htmlFor="searchDate" className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
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
      <label htmlFor="roomNumber" className="text-sm font-medium text-gray-700 dark:text-darkAccentGreen">
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
    <button
      type="submit"
      className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 md:col-span-3 lg:col-span-1 dark:bg-darkSurface dark:text-darkAccentGreen"
    >
      <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
      Search
    </button>
  </form>
);

export default React.memo(FilterBar);
