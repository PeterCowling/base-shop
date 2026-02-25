// File: src/components/prepare/PrepareDashboard.tsx
"use client";

import { memo, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useCheckoutCountsByRoomForDate } from "../../hooks/orchestrations/prepare/useCheckoutCountsByRoomForDate";
import useInHouseGuestsByRoom from "../../hooks/orchestrations/prepare/useInHouseGuestsByRoom";
import usePrepareDashboardData from "../../hooks/orchestrations/prepare/usePrepareDashboard";
import { getLocalToday, isToday as isTodayDate } from "../../utils/dateUtils";

import CleaningPriorityTable from "./CleaningPriorityTable";
import DateSelector from "./DateSelectorPP";

function PrepareDashboard(): JSX.Element {
  const { user } = useAuth();
  const localTodayStr = getLocalToday();
  const [selectedDate, setSelectedDate] = useState<string>(localTodayStr);

  // Retrieve aggregated data from existing orchestrator
  const {
    mergedData,
    isLoading: prepareLoading,
    error: prepareError,
    noRoomsData,
    noCheckinsData,
  } = usePrepareDashboardData(selectedDate);

  // Retrieve occupant data from our new in-house hook
  const {
    roomsData,
    loading: occupantLoading,
    error: occupantError,
  } = useInHouseGuestsByRoom(selectedDate);

  // Retrieve the checkout counts by room
  const {
    checkoutCountsByRoom,
    loading: checkoutCountsLoading,
    error: checkoutCountsError,
  } = useCheckoutCountsByRoomForDate(selectedDate);

  // Combine loading/error states
  const combinedLoading =
    prepareLoading || occupantLoading || checkoutCountsLoading;
  const combinedError = prepareError || occupantError || checkoutCountsError;

  // Build occupantCount mapping
  const occupantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(roomsData).forEach(([roomNumber, occupantIds]) => {
      counts[roomNumber] = occupantIds.length;
    });
    return counts;
  }, [roomsData]);

  // Merge occupantCount and checkoutCounts into final data
  const finalData = useMemo(() => {
    return mergedData.map((row) => {
      const occupantCount = occupantCounts[row.roomNumber] ?? 0;
      const checkouts = checkoutCountsByRoom[row.roomNumber] ?? 0;
      return {
        ...row,
        occupantCount,
        checkouts,
      };
    });
  }, [mergedData, occupantCounts, checkoutCountsByRoom]);

  // Loading
  if (combinedLoading) {
    return (
      <div className="min-h-screen flex flex-col p-5 bg-surface-2">
        <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
          PREPARE
        </h1>
        <div className="flex-grow bg-surface rounded-xl shadow-lg p-6 space-y-4">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            username={user?.user_name ?? ""}
          />
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  // Error
  if (combinedError) {
    return (
      <div className="min-h-screen flex flex-col p-5 bg-surface-2">
        <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
          PREPARE
        </h1>
        <div className="flex-grow bg-surface rounded-xl shadow-lg p-6 space-y-4">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            username={user?.user_name ?? ""}
          />
          <p className="text-error-main font-semibold">
            Error:{" "}
            {combinedError instanceof Error
              ? combinedError.message
              : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  // No data
  if (noRoomsData && noCheckinsData) {
    return (
      <div className="min-h-screen flex flex-col p-5 bg-surface-2">
        <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
          PREPARE
        </h1>
        <div className="flex-grow bg-surface rounded-xl shadow-lg p-6 space-y-4">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            username={user?.user_name ?? ""}
          />
          <div className="bg-surface border border-border-2 rounded shadow p-8 text-center italic text-muted-foreground">
            No cleaning data found for this date.
          </div>
        </div>
      </div>
    );
  }

  // "IsToday" used by the table
  const isTodayFlag = isTodayDate(selectedDate);

  return (
    <div className="min-h-screen flex flex-col p-5 bg-surface-2">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        PREPARE
      </h1>
      <div className="flex-grow bg-surface rounded-xl shadow-lg p-6 space-y-10">
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          username={user?.user_name ?? ""}
        />
        <CleaningPriorityTable data={finalData} isToday={isTodayFlag} />
      </div>
    </div>
  );
}

export default memo(PrepareDashboard);
