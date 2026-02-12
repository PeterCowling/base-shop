/* src/hooks/client/till/useTillShifts.ts */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MONTHLY_DISCREPANCY_LIMIT } from "../../../constants/cash";
import { settings } from "../../../constants/settings";
import { useAuth } from "../../../context/AuthContext";
import { useTillData } from "../../../context/TillDataContext";
import type { VarianceSignoff } from "../../../types/component/Till";
import type { Booking } from "../../../types/domains/bookingsDomain";
import { calculateDiscrepancy } from "../../../utils/cashUtils";
import { startOfMonthLocal, toEpochMillis } from "../../../utils/dateUtils";
import {
  generateShiftId,
  getStoredShiftId,
  setStoredShiftId,
} from "../../../utils/shiftId";
import { showToast } from "../../../utils/toastUtils";
import useBookings from "../../data/useBookingsData";
import { useCashDiscrepanciesData } from "../../data/useCashDiscrepanciesData";
import { useCashDrawerLimit } from "../../data/useCashDrawerLimit";
import { useSafeCountsData } from "../../data/useSafeCountsData";
import { useCashCountsMutations } from "../../mutations/useCashCountsMutations";
import { useCashDiscrepanciesMutations } from "../../mutations/useCashDiscrepanciesMutations";
import { useCCIrregularitiesMutations } from "../../mutations/useCCIrregularitiesMutations";
import { useDrawerAlertsMutations } from "../../mutations/useDrawerAlertsMutations";
import { useKeycardDiscrepanciesMutations } from "../../mutations/useKeycardDiscrepanciesMutations";
import { useShiftEventsMutations } from "../../mutations/useShiftEventsMutations";
import { useTillShiftsMutations } from "../../mutations/useTillShiftsMutations";

import { findOpenShift, getLastClose } from "./shiftUtils";
import { useShiftCalculations } from "./useShiftCalculations";

/**
 * Main hook for all Till logic:
 * - Prevent opening if there's an existing "opening" with no "close"
 * - Show the most recent close count as the previous
 * - Write new "opening" and "close" records to the DB
 * - Summarize net cash, net CC, doc deposits, keycards, etc.
 */
export function useTillShifts() {
  // Data hooks
  const { user } = useAuth();
  const userName = user?.user_name || "";
  const { transactions, cashCounts, creditSlips } = useTillData();
  const { bookings } = useBookings(); // Make sure useBookings returns something like Record<string, Booking>
  const { addCashCount } = useCashCountsMutations();
  const { cashDiscrepancies } = useCashDiscrepanciesData();
  const { addCashDiscrepancy } = useCashDiscrepanciesMutations();
  const { addCCIrregularity } = useCCIrregularitiesMutations();
  const { safeCounts } = useSafeCountsData();
  const { limit: cashDrawerLimit } = useCashDrawerLimit();
  const { addKeycardDiscrepancy } = useKeycardDiscrepanciesMutations();
  const { addShiftEvent } = useShiftEventsMutations();
  const { recordShiftOpen, recordShiftClose } = useTillShiftsMutations();
  const { logDrawerAlert } = useDrawerAlertsMutations();

  // Map occupantId -> occupant record for quick lookups
  const occupantsById = useMemo<Record<string, Booking>>(() => {
    const map: Record<string, Booking> = {};
    Object.values(bookings || {}).forEach((bookingMap) => {
      if (bookingMap && typeof bookingMap === "object") {
        const occupants = bookingMap as Record<string, Booking>;
        Object.values(occupants).forEach((occ) => {
          if (occ && occ.occupantId) {
            map[occ.occupantId] = occ;
          }
        });
      }
    });
    return map;
  }, [bookings]);

  // Local ephemeral state
  const [shiftOpenTime, setShiftOpenTime] = useState<Date | null>(null);
  const [shiftOwner, setShiftOwner] = useState<string | null>(null);
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(() =>
    getStoredShiftId()
  );
  const [previousShiftCloseTime, setPreviousShiftCloseTime] =
    useState<Date | null>(null);
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [openingKeycards, setOpeningKeycards] = useState<number>(0);
  const [finalCashCount, setFinalCashCount] = useState<number>(0);
  const [finalKeycardCount, setFinalKeycardCount] = useState<number>(0);

  const monthlyDiscrepancyCount = useMemo(() => {
    const start = startOfMonthLocal(new Date());
    return cashDiscrepancies.filter(
      (d) =>
        d.user === userName &&
        toEpochMillis(d.timestamp) >= start.getTime()
    ).length;
  }, [cashDiscrepancies, userName]);

  useEffect(() => {
    const openShift = findOpenShift(cashCounts);
    if (openShift) {
      setShiftOpenTime(new Date(openShift.timestamp));
      setShiftOwner(openShift.user);
      setOpeningCash(openShift.count ?? 0);
      setOpeningKeycards(openShift.keycardCount ?? 0);
      if (openShift.shiftId && openShift.shiftId !== currentShiftId) {
        setStoredShiftId(openShift.shiftId);
        setCurrentShiftId(openShift.shiftId);
      }
    } else {
      setShiftOpenTime(null);
      setShiftOwner(null);
      setOpeningCash(0);
      setOpeningKeycards(0);
      if (currentShiftId) {
        setStoredShiftId(null);
        setCurrentShiftId(null);
      }
    }
  }, [cashCounts, currentShiftId]);

  const lastCloseCashCount = useMemo(() => {
    const lastClose = getLastClose(cashCounts);
    return lastClose?.count ?? 0;
  }, [cashCounts]);

  const [showOpenShiftForm, setShowOpenShiftForm] = useState(false);
  const [showCloseShiftForm, setShowCloseShiftForm] = useState(false);
  const [closeShiftFormVariant, setCloseShiftFormVariant] =
    useState<"close" | "reconcile">("close");
  const [showKeycardCountForm, setShowKeycardCountForm] = useState(false);

  const {
    filteredTransactions,
    creditSlipTotal,
    netCash,
    netCC,
    docDepositsCount,
    docReturnsCount,
    keycardsLoaned,
    keycardsReturned,
    expectedKeycardsAtClose,
    expectedCashAtClose,
    drawerCash,
    isDrawerOverLimit,
    isTillOverMax,
    pinRequiredForTenderRemoval,
    ccTransactionsFromLastShift,
    ccTransactionsFromThisShift,
  } = useShiftCalculations({
    transactions,
    creditSlips,
    cashCounts,
    safeCounts,
    shiftOpenTime,
    previousShiftCloseTime,
    openingCash,
    openingKeycards,
    finalCashCount,
    cashDrawerLimit: cashDrawerLimit ?? undefined,
  });

  // Log to drawerAlerts when drawer goes over limit
  const prevOverLimit = useRef(false);
  useEffect(() => {
    if (isDrawerOverLimit && !prevOverLimit.current && cashDrawerLimit) {
      logDrawerAlert(expectedCashAtClose, cashDrawerLimit);
    }
    prevOverLimit.current = isDrawerOverLimit;
  }, [isDrawerOverLimit, expectedCashAtClose, cashDrawerLimit, logDrawerAlert]);

  /**
   * Attempt to find a booking whose occupantId matches the one we are looking for.
   * Important: Make sure your 'bookings' data is correctly typed as Record<string, Booking>.
   * Otherwise, you may need to cast manually:
   *   const found = (Object.values(bookings) as Booking[]).find(...).
   */
  const getOccupantName = useCallback(
    (occupantId: string): string => {
      const record = occupantsById[occupantId];
      if (!record) {
        return occupantId || "Unknown occupant";
      }
      const { firstName = "", lastName = "" } = record;
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || occupantId || "Unknown occupant";
    },
    [occupantsById]
  );

  // Utility: get a quick booking descriptor based on bookingRef
  const getBookingDesc = useCallback(
    (bookingRef: string): string =>
      bookings[bookingRef] ? `Booking #${bookingRef}` : bookingRef || "-",
    [bookings]
  );

  // -------------------- SHIFT OPEN --------------------
  const handleOpenShiftClick = useCallback(() => {
    if (!user) {
      showToast("Not authorized. Please log in.", "error");
      return;
    }
    if (shiftOpenTime) {
      showToast("A shift is already open in this local session.", "info");
      return;
    }
    setShowOpenShiftForm(true);
  }, [user, shiftOpenTime, setShowOpenShiftForm]);

  /**
   * Called by OpenShiftForm to finalize opening the till in the database.
   */
  const confirmShiftOpen = useCallback(
    (
      calculatedCash: number,
      allReceiptsConfirmed: boolean,
      openingKeycards = 0,
      denomBreakdown: Record<string, number> = {}
    ) => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      // If unconfirmed CC from last shift, block
      if (ccTransactionsFromLastShift.length > 0 && !allReceiptsConfirmed) {
        showToast(
          "Please confirm all CC receipts from the previous shift first.",
          "info"
        );
        return;
      }

      // 1. Check if there's an open shift in the DB
      const openShift = findOpenShift(cashCounts);
      if (openShift) {
        if (openShift.user !== userName) {
          showToast(
            "The till is currently open under another user. " +
              "That user must close it before anyone else can open it.",
            "error"
          );
          return;
        }
        // If the open shift belongs to the same user but this session
        // does not have an active shift (e.g. just closed), allow the
        // opening to proceed. Otherwise block as usual.
        if (shiftOpenTime) {
          showToast(
            "You already have an open till record in the database. Please close it first.",
            "error"
          );

          return;
          // fall through when shiftOpenTime is null - the previous close may
          // not have propagated yet but the user should be able to open again
        }
      }

      // 2. The last close is the "previous" count
      const lastClose = getLastClose(cashCounts);
      const previousCloseCount = lastClose?.count ?? 0;
      const previousKeycards = lastClose?.keycardCount ?? 0;

      // 3. Calculate difference = newCount - previousCloseCount
      const difference = calculateDiscrepancy(
        calculatedCash,
        previousCloseCount
      );
      const keycardDifference = openingKeycards - previousKeycards;

      const shiftId = generateShiftId();
      setStoredShiftId(shiftId);
      setCurrentShiftId(shiftId);

      // 4. Write to /cashCounts
      addCashCount(
        "opening",
        calculatedCash,
        difference,
        undefined,
        denomBreakdown,
        openingKeycards
      );
      recordShiftOpen(shiftId, {
        openingCash: calculatedCash,
        openingKeycards,
      });
      if (keycardDifference !== 0) {
        addKeycardDiscrepancy(keycardDifference);
      }
      if (difference !== 0) {
        addCashDiscrepancy(difference);
        if (monthlyDiscrepancyCount + 1 > MONTHLY_DISCREPANCY_LIMIT) {
          showToast(
            "Monthly discrepancy limit exceeded for this user.",
            "warning"
          );
        }
      }

      // 5. Set ephemeral state
      setOpeningCash(calculatedCash);
      setOpeningKeycards(openingKeycards);
      setShiftOpenTime(new Date());
      setShiftOwner(user.user_name);
      setFinalCashCount(0);
      setFinalKeycardCount(0);
      setShowOpenShiftForm(false);
      addShiftEvent("open", calculatedCash, openingKeycards, difference, shiftId);

      // Track the last close timestamp (for next shift)
      if (lastClose) {
        setPreviousShiftCloseTime(new Date(lastClose.timestamp));
      }
    },
    [
      user,
      userName,
      ccTransactionsFromLastShift.length,
      cashCounts,
      shiftOpenTime,
      addCashCount,
      addCashDiscrepancy,
      addKeycardDiscrepancy,
      addShiftEvent,
      recordShiftOpen,
      monthlyDiscrepancyCount,
      setCurrentShiftId,
      setShowOpenShiftForm,
    ]
  );

  const addKeycardsFromSafe = useCallback((count: number) => {
    setOpeningKeycards((prev) => prev + count);
  }, []);

  const returnKeycardsToSafe = useCallback(
    (count: number) => {
      let success = false;
      setOpeningKeycards((prev) => {
        if (count > prev) {
          showToast("Cannot return more keycards than available.", "error");
          addKeycardDiscrepancy(prev - count);
          success = false;
          return prev;
        }
        success = true;
        return prev - count;
      });
      return success;
    },
    [addKeycardDiscrepancy]
  );

  // -------------------- SHIFT CLOSE --------------------
  const handleCloseShiftClick = useCallback(
    (variant: "close" | "reconcile" = "close") => {
      if (!shiftOpenTime) {
        showToast("No shift is currently open in this local session.", "info");
        return;
      }
      if (!user || user.user_name !== shiftOwner) {
        showToast("Only the user who opened this shift can close it.", "error");
        return;
      }
      if (variant === "close") {
        const limit = cashDrawerLimit ?? settings.tillMaxLimit;
        if (expectedCashAtClose > limit) {
          showToast(
            "Till exceeds maximum cash. Perform a safe drop first.",
            "warning"
          );
          return;
        }
      }
      setCloseShiftFormVariant(variant);
      setShowCloseShiftForm(true);
    }, [
      shiftOpenTime,
      user,
      shiftOwner,
      expectedCashAtClose,
      cashDrawerLimit,
      setCloseShiftFormVariant,
      setShowCloseShiftForm,
    ]);

  const handleKeycardCountClick = useCallback(() => {
    if (!shiftOpenTime) {
      showToast("No shift is currently open in this local session.", "info");
      return;
    }
    setShowKeycardCountForm(true);
  }, [shiftOpenTime, setShowKeycardCountForm]);


  /**
   * Called by CloseShiftForm to finalize closing the till in the database.
   */
  const confirmShiftClose = useCallback(
    (
      action: "close" | "reconcile",
      countedCash: number,
      countedKeycards: number,
      allReceiptsConfirmed: boolean,
      denomBreakdown: Record<string, number> = {},
      varianceSignoff?: VarianceSignoff,
      varianceSignoffRequired?: boolean
    ) => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      if (ccTransactionsFromThisShift.length > 0 && !allReceiptsConfirmed) {
        addCCIrregularity(action, ccTransactionsFromThisShift.length);
      }

      const openShift = findOpenShift(cashCounts);
      if (!openShift) {
        showToast(
          "Cannot close the till because it is not currently open.",
          "error"
        );
        return;
      }

      const existingShiftId = currentShiftId ?? getStoredShiftId();
      const closeShiftId = existingShiftId ?? generateShiftId();
      if (!existingShiftId) {
        setStoredShiftId(closeShiftId);
        setCurrentShiftId(closeShiftId);
      }

      const difference = calculateDiscrepancy(
        countedCash,
        expectedCashAtClose
      );

      if (varianceSignoffRequired && !varianceSignoff) {
        showToast("Manager sign-off is required before closing this shift.", "error");
        return;
      }

      if (action === "close") {
        addCashCount(
          "close",
          countedCash,
          difference,
          undefined,
          denomBreakdown,
          countedKeycards
        );
        recordShiftClose(closeShiftId, {
          closingCash: countedCash,
          closingKeycards: countedKeycards,
          closeDifference: difference,
          closeType: "close",
          varianceSignoffRequired,
          signedOffBy: varianceSignoff?.signedOffBy,
          signedOffByUid: varianceSignoff?.signedOffByUid,
          signedOffAt: varianceSignoff?.signedOffAt,
          varianceNote: varianceSignoff?.varianceNote,
        });
        addShiftEvent(
          "close",
          countedCash,
          countedKeycards,
          difference,
          closeShiftId
        );
      } else {
        addCashCount(
          "reconcile",
          countedCash,
          difference,
          undefined,
          denomBreakdown,
          countedKeycards
        );
        recordShiftClose(closeShiftId, {
          closingCash: countedCash,
          closingKeycards: countedKeycards,
          closeDifference: difference,
          closeType: "reconcile",
          varianceSignoffRequired,
          signedOffBy: varianceSignoff?.signedOffBy,
          signedOffByUid: varianceSignoff?.signedOffByUid,
          signedOffAt: varianceSignoff?.signedOffAt,
          varianceNote: varianceSignoff?.varianceNote,
        });
        addShiftEvent(
          "reconcile",
          countedCash,
          countedKeycards,
          difference,
          closeShiftId
        );

        const nextShiftId = generateShiftId();
        setStoredShiftId(nextShiftId);
        setCurrentShiftId(nextShiftId);
        addCashCount(
          "opening",
          countedCash,
          0,
          undefined,
          denomBreakdown,
          countedKeycards
        );
        recordShiftOpen(nextShiftId, {
          openingCash: countedCash,
          openingKeycards: countedKeycards,
        });
      }
      if (difference !== 0) {
        addCashDiscrepancy(difference);
        if (monthlyDiscrepancyCount + 1 > MONTHLY_DISCREPANCY_LIMIT) {
          showToast(
            "Monthly discrepancy limit exceeded for this user.",
            "warning"
          );
        }
      }
      const keycardDiff = countedKeycards - expectedKeycardsAtClose;
      if (keycardDiff !== 0) {
        addKeycardDiscrepancy(keycardDiff);
      }
      if (action === "close") {
        setFinalCashCount(countedCash);
        setFinalKeycardCount(countedKeycards);
        setPreviousShiftCloseTime(new Date());
        setShiftOpenTime(null);
        setShiftOwner(null);
        setShowCloseShiftForm(false);
        setStoredShiftId(null);
        setCurrentShiftId(null);
      } else {
        setOpeningCash(countedCash);
        setOpeningKeycards(countedKeycards);
        setFinalCashCount(0);
        setFinalKeycardCount(0);
        setShowCloseShiftForm(false);
      }

    },
    [
      user,
      ccTransactionsFromThisShift.length,
      cashCounts,
      expectedCashAtClose,
      addCashCount,
      addCashDiscrepancy,
      monthlyDiscrepancyCount,
      addCCIrregularity,
      addKeycardDiscrepancy,
      addShiftEvent,
      currentShiftId,
      recordShiftClose,
      recordShiftOpen,
      expectedKeycardsAtClose,
      setShowCloseShiftForm,
      setCurrentShiftId,
    ]
  );


  const confirmKeycardReconcile = useCallback(
    (counted: number) => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      const diff = counted - expectedKeycardsAtClose;
      if (diff !== 0) {
        addKeycardDiscrepancy(diff);
      }
      addCashCount("reconcile", 0, 0, undefined, undefined, counted);
      setFinalKeycardCount(counted);
      setShowKeycardCountForm(false);
    },
    [
      user,
      addCashCount,
      setShowKeycardCountForm,
      expectedKeycardsAtClose,
      addKeycardDiscrepancy,
    ]
  );


  return {
    // Data
    user,
    shiftOpenTime,
    shiftOwner,
    previousShiftCloseTime,
    openingCash,
    openingKeycards,
    finalCashCount,
    finalKeycardCount,
    filteredTransactions,

    // Summaries
    netCash,
    netCC,
    creditSlipTotal,
    docDepositsCount,
    docReturnsCount,
    keycardsLoaned,
    keycardsReturned,
    expectedKeycardsAtClose,
    expectedCashAtClose,
    drawerCash,
    isDrawerOverLimit,
    isTillOverMax,
    pinRequiredForTenderRemoval,

    // CC details
    ccTransactionsFromLastShift,
    ccTransactionsFromThisShift,

    // Helpers
    getOccupantName,
    getBookingDesc,

    // UI toggles
    showOpenShiftForm,
    showCloseShiftForm,
    showKeycardCountForm,
    setShowOpenShiftForm,
    setShowCloseShiftForm,
    closeShiftFormVariant,
    setCloseShiftFormVariant,
    setShowKeycardCountForm,

    // Actions
    handleOpenShiftClick,
    confirmShiftOpen,
    handleCloseShiftClick,
    confirmShiftClose,
    handleKeycardCountClick,
    confirmKeycardReconcile,
    addKeycardsFromSafe,
    returnKeycardsToSafe,
    lastCloseCashCount,
  };
}

// Export helpers for testing
export { findOpenShift, getLastClose } from "./shiftUtils";
