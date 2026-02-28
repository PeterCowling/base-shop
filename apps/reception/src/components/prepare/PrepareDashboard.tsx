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
import PreparePage from "./PreparePage";

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

  const dateSelector = (
    <DateSelector
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      username={user?.user_name ?? ""}
    />
  );

  // Loading
  if (combinedLoading) {
    return (
      <PreparePage dateSelector={dateSelector}>
        <p>Loading data...</p>
      </PreparePage>
    );
  }

  // Error
  if (combinedError) {
    return (
      <PreparePage dateSelector={dateSelector}>
        <p className="text-error-main font-semibold">
          Error:{" "}
          {combinedError instanceof Error
            ? combinedError.message
            : "Unknown error"}
        </p>
      </PreparePage>
    );
  }

  // No data
  if (noRoomsData && noCheckinsData) {
    return (
      <PreparePage dateSelector={dateSelector}>
        <div className="bg-surface border border-border-2 rounded-lg shadow p-8 text-center italic text-muted-foreground">
          No cleaning data found for this date.
        </div>
      </PreparePage>
    );
  }

  // "IsToday" used by the table
  const isTodayFlag = isTodayDate(selectedDate);

  return (
    <PreparePage dateSelector={dateSelector}>
      <CleaningPriorityTable data={finalData} isToday={isTodayFlag} />
    </PreparePage>
  );
}

export default memo(PrepareDashboard);
