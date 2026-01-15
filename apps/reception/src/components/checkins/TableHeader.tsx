// File: src/components/roomview/TableHeader.tsx

import React from "react";

/**
 * Static table header row using Font Awesome icons only.
 * All text has been removed from header cells per request.
 */
const TableHeader: React.FC = () => {
  return (
    <thead
      className="sticky top-0 bg-gray-100 text-gray-800 border-b border-gray-300 z-5 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface"
    >
      <tr className="h-12">
        {/* Guest Name */}
        <th className="px-4 py-2 w-[200px] font-semibold" title="Guest Name">
          <div className="flex justify-center items-center">
            <i className="fas fa-user" />
          </div>
        </th>

        {/* Room Allocated */}
        <th
          className="px-4 py-2 w-[120px] font-semibold"
          title="Room Allocated"
        >
          <div className="flex justify-center items-center">
            <i className="fas fa-bed" />
          </div>
        </th>

        {/* Room Payment */}
        <th className="px-4 py-2 w-[125px] font-semibold" title="Room Payment">
          <div className="flex justify-center items-center">
            <i className="fas fa-credit-card" />
          </div>
        </th>

        {/* City Tax */}
        <th className="px-4 py-2 w-[125px] font-semibold" title="City Tax">
          <div className="flex justify-center items-center">
            <i className="fas fa-coins" />
          </div>
        </th>

        {/* Keycard Deposit */}
        <th
          className="px-4 py-2 w-[125px] font-semibold"
          title="Keycard Deposit"
        >
          <div className="flex justify-center items-center">
            <i className="fas fa-key" />
          </div>
        </th>

        {/* Status */}
        <th className="px-4 py-2 w-[120px] font-semibold" title="Status">
          <div className="flex justify-center items-center">
            <i className="fas fa-clock" />
          </div>
        </th>

        {/* Document Insert */}
        <th
          className="px-4 py-2 w-[150px] font-semibold"
          title="Document Insert"
        >
          <div className="flex justify-center items-center">
            <i className="fas fa-file-alt" />
          </div>
        </th>

        {/* Email Booking */}
        <th className="px-4 py-2 w-[150px] font-semibold" title="Email Booking">
          <div className="flex justify-center items-center">
            <i className="fas fa-envelope" />
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;
