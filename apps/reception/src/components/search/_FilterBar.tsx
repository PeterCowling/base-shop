/* src/components/bookingSearch/FilterBar.tsx */

import React from "react";

interface FilterBarProps {
  firstName: string;
  lastName: string;
  bookingRef: string;
  status: string;
  nonRefundable: string;
  onFilterChange: (field: string, value: string) => void;
  /** Called when the user clicks the "Search" button. */
  date: string;
  roomNumber: string;
  onSearch: () => void;
  /** Map of activity codes to descriptive text. */
  activityCodes: Record<number, string>;
}

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
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-end mb-4">
      {/* First Name */}
      <div className="flex flex-col">
        <label htmlFor="firstName" className="font-semibold text-gray-700">
          First Name:
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => onFilterChange("firstName", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        />
      </div>

      {/* Last Name */}
      <div className="flex flex-col">
        <label htmlFor="lastName" className="font-semibold text-gray-700">
          Last Name:
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => onFilterChange("lastName", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        />
      </div>

      {/* Booking Ref */}
      <div className="flex flex-col">
        <label htmlFor="bookingRef" className="font-semibold text-gray-700">
          Booking Ref:
        </label>
        <input
          id="bookingRef"
          type="text"
          value={bookingRef}
          onChange={(e) => onFilterChange("bookingRef", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        />
      </div>

      {/* Activity Level (status) */}
      <div className="flex flex-col">
        <label htmlFor="status" className="font-semibold text-gray-700">
          Activity Level:
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
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
        <label htmlFor="nonRefundable" className="font-semibold text-gray-700">
          Refundable Status:
        </label>
        <select
          id="nonRefundable"
          value={nonRefundable}
          onChange={(e) => onFilterChange("nonRefundable", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        >
          <option value="">All</option>
          <option value="true">Non-Refundable Only</option>
          <option value="false">Refundable Only</option>
        </select>
      </div>

      {/* Date */}
      <div className="flex flex-col">
        <label htmlFor="searchDate" className="font-semibold text-gray-700">
          Date:
        </label>
        <input
          id="searchDate"
          type="date"
          value={date}
          onChange={(e) => onFilterChange("date", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        />
      </div>

      {/* Room Number */}
      <div className="flex flex-col">
        <label htmlFor="roomNumber" className="font-semibold text-gray-700">
          Room Number:
        </label>
        <input
          id="roomNumber"
          type="text"
          value={roomNumber}
          onChange={(e) => onFilterChange("roomNumber", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-blue-500 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        />
      </div>

      {/* Search button */}
      <button
        onClick={onSearch}
        className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Search
      </button>
    </div>
  );
};

export default React.memo(FilterBar);
