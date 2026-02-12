"use client";

import React, { type ChangeEvent, useMemo, useState } from "react";

import useEmailProgressData, {
  type EmailProgressData,
} from "../../hooks/client/checkin/useEmailProgressData";
import useEmailProgressActions from "../../hooks/orchestrations/emailAutomation/useEmailProgressActions";

import EmailProgressLists from "./EmailProgressLists";

interface EmailProgressProps {
  /**
   * A callback for setting a message in the parent component.
   * Currently unused in this component, but provided for extensibility.
   */
  setMessage: (msg: string) => void;
}

/**
 * Displays email progress and allows filtering of email records.
 */
const EmailProgress: React.FC<EmailProgressProps> = ({
  setMessage: _setMessage,
}) => {
  // Retrieve email data from the data hook
  const { emailData, loading, error } = useEmailProgressData();
  // Retrieve action methods from the actions hook
  const { logNextActivity, logConfirmActivity } = useEmailProgressActions();

  // Store the filter text
  const [filterText, setFilterText] = useState<string>("");

  /**
   * Memoize the incoming email data array to prevent unnecessary recalculations.
   */
  const memoizedEmailData = useMemo<EmailProgressData[]>(() => {
    return Array.isArray(emailData) ? emailData : [];
  }, [emailData]);

  /**
   * Filter the data by booking reference or occupant name, based on user input.
   */
  const filteredEmailData = useMemo<EmailProgressData[]>(() => {
    if (!filterText) return memoizedEmailData;
    const lowerFilter = filterText.toLowerCase();
    return memoizedEmailData.filter((item) => {
      const refMatch = item.bookingRef.toLowerCase().includes(lowerFilter);
      const nameMatch = item.occupantName.toLowerCase().includes(lowerFilter);
      return refMatch || nameMatch;
    });
  }, [memoizedEmailData, filterText]);

  // Render
  return (
    <div className="min-h-[80vh] p-4 bg-gray-100 dark:bg-darkBg font-sans text-gray-800 dark:text-darkAccentGreen">
      {/* Title */}
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        EMAIL OPT-IN
      </h1>

      <div className="flex-grow bg-white dark:bg-darkSurface rounded-lg shadow p-6 space-y-4">
        {/* Loading or Error State */}
        {loading ? (
          <div className="flex justify-center items-center my-6">
            <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin dark:border-darkSurface" />
          </div>
        ) : error ? (
          <div className="text-error-main font-semibold text-center mt-8">
            Error loading email progress data:{" "}
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : (
          <>
            {/* Filter Input */}
            <div className="w-full flex justify-end mb-4">
              <div className="w-72">
                <label
                  htmlFor="filterInput"
                  className="block text-sm font-semibold text-gray-700 mb-1 dark:text-darkAccentGreen"
                >
                  Booking Ref or Surname
                </label>
                <input
                  id="filterInput"
                  type="text"
                  className="w-full border border-primary-light rounded px-3 py-1 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-primary-main"
                  placeholder="Type to filter..."
                  value={filterText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFilterText(e.target.value)
                  }
                />
              </div>
            </div>

            {/* Main Lists */}
            <div className="w-full mt-2">
              <EmailProgressLists
                emailData={filteredEmailData}
                logNextActivity={logNextActivity}
                logConfirmActivity={logConfirmActivity}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(EmailProgress);
