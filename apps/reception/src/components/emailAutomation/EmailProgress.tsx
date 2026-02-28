"use client";

import React, { type ChangeEvent, useMemo, useState } from "react";

import { Input } from "@acme/design-system";

import useEmailProgressData, {
  type EmailProgressData,
} from "../../hooks/client/checkin/useEmailProgressData";
import useEmailProgressActions from "../../hooks/orchestrations/emailAutomation/useEmailProgressActions";
import { PageShell } from "../common/PageShell";
import { Spinner } from "../common/Spinner";

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
    <PageShell title="EMAIL OPT-IN">
      <div className="flex-grow bg-surface rounded-lg shadow-lg p-6 space-y-4">
        {/* Loading or Error State */}
        {loading ? (
          <div className="flex justify-center items-center my-6">
            <Spinner size="md" />
          </div>
        ) : error ? (
          <div className="text-danger-fg font-semibold text-center mt-8 p-3 bg-danger-fg/10 rounded-lg border border-danger-fg/30">
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
                  className="block text-sm font-semibold text-foreground mb-1"
                >
                  Booking Ref or Surname
                </label>
                <Input
                  compatibilityMode="no-wrapper"
                  id="filterInput"
                  type="text"
                  className="w-full border border-border-strong rounded-lg px-3 py-1"
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
    </PageShell>
  );
};

export default React.memo(EmailProgress);
