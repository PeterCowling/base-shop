// src/hooks/mutations/useAddGuestToBookingMutation.ts

/**
 * Mutator Hook:
 * Creates a new non‑lead guest occupant by replicating essential
 * booking data from an existing occupant, ensuring that:
 *   - room allocated
 *   - room booked
 *   - number of nights
 *   - activity logging (activities and activitiesByCode)
 *   - check in details
 *   - check out details
 *
 * all match those of the specified occupant in the existing booking.
 * The city tax is calculated automatically as (numberOfNights * 2.5).
 *
 * Writes (batched atomic update):
 *   /bookings/<reservationCode>/<newOccupantId>
 *   /guestsDetails/<reservationCode>/<newOccupantId>
 *   /activities/<newOccupantId>/<activityId>
 *   /activitiesByCode/<code>/<newOccupantId>/<activityId>
 *   /checkins/<checkInDate>/<newOccupantId>
 *   /checkouts/<checkOutDate>/<newOccupantId>
 *   /cityTax/<reservationCode>/<newOccupantId>
 *   /guestByRoom/<newOccupantId>
 *   /bagStorage/<newOccupantId>
 *   /preorder/<newOccupantId> (if existing occupant’s reservationCode is 6‑char alphanumeric)
 *   /completedTasks/<newOccupantId>
 *   /guestsByBooking/<newOccupantId>
 *   /roomsByDate/<checkInDate>/index_<roomNumber>/<roomNumber>/guestIds
 *
 * No financialsRoom creation is performed for this new occupant,
 * as they are never the lead guest.
 *
 * Quota & Errors:
 *   - Reads:
 *       1) The occupant to be replicated under /bookings/<reservationCode>/<existingOccupantId>
 *       2) The occupant's existing personal details under /guestsDetails/<reservationCode>/<existingOccupantId>
 *       3) The occupant's existing activities under /activities/<existingOccupantId>
 *       4) The occupant's code-based activities under /activitiesByCode
 *       5) roomsByDate for each room to merge occupant IDs
 *   - Single update() call for all writes.
 *   - Must be wrapped in try/catch for UI error handling and to handle concurrency.
 */

import { useCallback } from "react";
import { type Database, get, ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { getCurrentIsoTimestamp } from "../../utils/dateUtils";

/** Minimal shape of occupant data stored in /bookings/<reservationCode>/<occupantId>. */
interface ExistingOccupantData {
  checkInDate: string;
  checkOutDate: string;
  roomNumbers: string[];
  nights?: number; // or string in older DB data
  // ...any other fields relevant to occupant
}

/** Minimal shape of occupant personal details stored in /guestsDetails. */
interface ExistingGuestPersonalDetails {
  email?: string;
  citizenship?: string;
  dateOfBirth?: { dd?: string; mm?: string; yyyy?: string };
  document?: { type?: string; number?: string };
  firstName?: string;
  lastName?: string;
  gender?: string;
  language?: string;
  municipality?: string;
  placeOfBirth?: string;
}

/** Minimal shape of occupant activity record. */
interface ActivityRecord {
  code?: number;
  timestamp?: string;
  who?: string;
  // anything else that might appear
}

/** Options controlling occupant creation. Reserved for future expansions. */
export type AddGuestOptions = Record<string, never>;

/**
 * Orchestrator function (pure data, read‑write):
 * Replicates occupant data from an existing occupant in a booking,
 * then adds the new occupant references in a single batch update.
 *
 * @param database - The Firebase Realtime Database instance
 * @param reservationCode - The booking reference under /bookings/<reservationCode>
 * @param existingOccupantId - The occupant to replicate (we copy their data)
 * @returns a function that, given new occupant identity overrides (e.g. name),
 *          creates the occupant records in Firebase.
 *
 * Side Effects:
 *   - Reads occupant data from:
 *       /bookings/<reservationCode>/<existingOccupantId>
 *       /guestsDetails/<reservationCode>/<existingOccupantId>
 *       /activities/<existingOccupantId>
 *       /activitiesByCode/<code>/<existingOccupantId>
 *       /roomsByDate/... for each relevant room
 *   - Writes occupant data to multiple paths in a single atomic update().
 *
 * Quota Impact:
 *   - Up to ~5 or more reads depending on occupant's roomNumbers and activities,
 *     plus a single large update() call that writes all occupant references.
 *   - If many occupants are added at once, consider using transactions or
 *     chunking the operation carefully.
 *
 * Safe Extension Notes:
 *   - You can add more occupant fields or replicate more subpaths easily
 *     by extending the read and write objects in a single transaction.
 */
async function replicateExistingOccupant(
  database: Database,
  reservationCode: string,
  existingOccupantId: string
): Promise<{
  baseData: ExistingOccupantData;
  personalData: ExistingGuestPersonalDetails;
  clonedActivities: { [activityId: string]: ActivityRecord };
  clonedActivitiesByCode: {
    [code: string]: { [activityId: string]: Omit<ActivityRecord, "code"> };
  };
}> {
  // 1) read occupant booking data
  const bookingPath = `bookings/${reservationCode}/${existingOccupantId}`;
  const bookingSnap = await get(ref(database, bookingPath));
  if (!bookingSnap.exists()) {
    throw new Error(
      `No occupant data found at /bookings/${reservationCode}/${existingOccupantId}`
    );
  }
  const baseData = bookingSnap.val() as ExistingOccupantData;

  // 2) read occupant personal details
  const personalPath = `guestsDetails/${reservationCode}/${existingOccupantId}`;
  const personalSnap = await get(ref(database, personalPath));
  const personalData = (
    personalSnap.exists() ? personalSnap.val() : {}
  ) as ExistingGuestPersonalDetails;

  // 3) read occupant activities
  const activitiesPath = `activities/${existingOccupantId}`;
  const activitiesSnap = await get(ref(database, activitiesPath));
  const clonedActivities: Record<string, ActivityRecord> =
    activitiesSnap.exists() ? activitiesSnap.val() : {};

  // 4) read occupant code-based activities
  //    (We *could* read all "activitiesByCode" and filter occupantId,
  //     but that might be large. Another approach is enumerating known
  //     codes or storing occupant's code set. For simplicity, let's read
  //     the entire subtree "activitiesByCode" and filter occupant keys.
  //     In production, you'd optimize or keep code-lists in your store.)
  const actByCodePath = `activitiesByCode`;
  const actByCodeSnap = await get(ref(database, actByCodePath));
  const allCodesData = actByCodeSnap.exists()
    ? (actByCodeSnap.val() as {
        [code: string]: { [occId: string]: Record<string, ActivityRecord> };
      })
    : {};

  // We'll build a partial object that only includes occupant's code-based entries
  const clonedActivitiesByCode: {
    [code: string]: { [activityId: string]: Omit<ActivityRecord, "code"> };
  } = {};

  Object.entries(allCodesData).forEach(([codeStr, occupantMap]) => {
    const occupantObj = occupantMap[existingOccupantId];
    if (!occupantObj) return; // occupant not in this code
    // occupantObj is { [activityId]: ActivityRecord }
    // store under new occupant in final structure
    const partial: Record<string, Omit<ActivityRecord, "code">> = {};
    for (const [actId, actData] of Object.entries(occupantObj)) {
      const { code: _code, ...rest } = actData; // remove "code" field; the top-level code key is enough
      partial[actId] = { ...rest };
    }
    clonedActivitiesByCode[codeStr] = partial;
  });

  return {
    baseData,
    personalData,
    clonedActivities,
    clonedActivitiesByCode,
  };
}

/**
 * ID Generators:
 * occupantId => "occ_<timestamp>"
 * activityId => "act_<timestamp>"
 */
function generateOccupantId(): string {
  return "occ_" + Date.now();
}
function generateActivityId(): string {
  return "act_" + Date.now();
}

/**
 * Helper: checks if `str` is exactly 6 alphanumeric characters.
 */
function isSixAlphaNumeric(str: string): boolean {
  return /^[A-Za-z0-9]{6}$/.test(str);
}

/**
 * Orchestrator (writes):
 * Clones occupant data from an existing occupant (matching all the check-in,
 * check-out, room, etc.), then writes references for the new occupant.
 * The new occupant’s personal fields can be overridden by occupantOverrides
 * (e.g., new firstName, lastName). City tax is computed as nights * 2.5.
 *
 * @param database - Firebase DB instance
 * @param reservationCode - e.g. "ABC123"
 * @param existingOccupantId - occupant to replicate
 * @param occupantOverrides - e.g. { firstName: "Auto", lastName: "Created" }
 * @param options - future expansions (if we want to pass custom cityTax, etc.)
 * @returns Promise<void>
 *
 * Side Effects:
 *   - Writes multiple paths in a single update(), logs cityTax = nights * 2.5
 *   - Creates occupant's /activities, /activitiesByCode, /checkins, /checkouts
 *   - Potentially creates /preorder if code is 6-alphanumeric
 *
 * Quota & Errors:
 *   - 1 read for occupant booking data, 1 for occupant personal details,
 *     plus up to 2 for occupant activities, plus a roomsByDate read per room => ~5+ reads.
 *   - Single large update call.
 *   - Wrap in try/catch in UI for friendly error handling.
 */
async function addReplicatedGuest(
  database: Database,
  reservationCode: string,
  existingOccupantId: string,
  occupantOverrides: Partial<ExistingGuestPersonalDetails> = {},
  _options: AddGuestOptions = {}
): Promise<void> {
  const trimmedCode = reservationCode.trim();
  if (!trimmedCode) {
    throw new Error("No valid reservation code provided.");
  }

  // 1) replicate occupant data by reading the existing occupant
  const { baseData, personalData, clonedActivities, clonedActivitiesByCode } =
    await replicateExistingOccupant(database, trimmedCode, existingOccupantId);

  const {
    checkInDate,
    checkOutDate,
    roomNumbers,
    nights: occupantNights,
  } = baseData;

  if (!checkInDate || !checkOutDate || !roomNumbers?.length) {
    throw new Error(
      `Existing occupant data is incomplete or missing checkInDate, checkOutDate, or rooms.`
    );
  }

  // 2) Decide how many nights. If occupantNights is string, parse it
  let nightsCount: number;
  if (typeof occupantNights === "string") {
    const parsed = parseInt(occupantNights, 10);
    nightsCount = isNaN(parsed) ? 1 : parsed;
  } else {
    nightsCount = occupantNights ?? 1;
  }

  // 3) new occupant ID
  const newOccId = generateOccupantId();

  // 4) build occupant payload for /bookings
  const occupantPayload = {
    checkInDate,
    checkOutDate,
    roomNumbers,
    leadGuest: false, // new occupant is typically not the lead
    nights: nightsCount,
  };

  // 5) build occupant details, merging overrides with old occupant's data
  const mergedGuestDetails = {
    ...personalData,
    ...occupantOverrides,
  };

  // 6) replicate occupant's activities
  //    We'll generate new activityIds, but keep the same code + data
  //    for /activities, and for each code in /activitiesByCode.
  const newActivitiesEntries: Record<string, unknown> = {};
  const newActivitiesByCodeEntries: Record<string, unknown> = {};

  // /activities/<newOccId>/<newActId> = { ...cloned data }
  Object.entries(clonedActivities).forEach(([_oldActId, actData]) => {
    const newId = generateActivityId();
    // replicate all fields
    newActivitiesEntries[`/activities/${newOccId}/${newId}`] = { ...actData };
  });

  // /activitiesByCode/<code>/<newOccId>/<newActId> = same except "code" is the key
  // (the occupant's old code is the outer key, the occupantId changes to newOccId)
  for (const [codeStr, occupantObj] of Object.entries(clonedActivitiesByCode)) {
    const code = codeStr.trim();
    for (const [_oldActId, actFields] of Object.entries(occupantObj)) {
      const newId = generateActivityId();
      // replicate the occupant’s activity in code-based path
      newActivitiesByCodeEntries[
        `/activitiesByCode/${code}/${newOccId}/${newId}`
      ] = {
        ...actFields,
      };
    }
  }

  // 7) checkins and checkouts
  const timestampNow = getCurrentIsoTimestamp();
  const checkInPayload = {
    reservationCode: trimmedCode,
    timestamp: timestampNow,
  };
  const checkOutPayload = {
    reservationCode: trimmedCode,
    timestamp: timestampNow,
  };

  // 8) cityTax: nights * 2.5
  const computedCityTax = Number((nightsCount * 2.5).toFixed(2));
  const cityTaxPayload = {
    balance: computedCityTax,
    totalDue: computedCityTax,
    totalPaid: 0,
  };

  // 9) /guestByRoom: allocate the same primary room
  const primaryRoom = roomNumbers[0];
  const guestByRoomPayload = {
    allocated: primaryRoom,
    booked: primaryRoom,
  };

  // 10) /bagStorage occupant
  const bagStoragePayload = {
    isEligible: true,
    optedIn: false,
  };

  // 11) /preorder occupant if code is 6 alphanumeric
  const preorderEntries: Record<string, unknown> = {};
  if (isSixAlphaNumeric(trimmedCode)) {
    // reuse the same logic from your original sample or tailor as needed
    // e.g. if occupant's nights => create night1..nightN with meal plan
    const roomNumParsed = parseInt(primaryRoom, 10) || 1;

    let breakfastVal: string;
    let drink1Val: string;
    let drink2Val: string;
    if ([3, 4, 8, 9, 10].includes(roomNumParsed)) {
      // Plan A
      breakfastVal = "PREPAID MP A";
      drink1Val = "PREPAID MP A";
      drink2Val = "NA";
    } else if ([5, 6, 7].includes(roomNumParsed)) {
      // Plan B
      breakfastVal = "PREPAID MP B";
      drink1Val = "PREPAID MP B";
      drink2Val = "NA";
    } else if ([11, 12].includes(roomNumParsed)) {
      // Plan C
      breakfastVal = "PREPAID MP C";
      drink1Val = "PREPAID MP C";
      drink2Val = "PREPAID MP C";
    } else {
      // Default fallback
      breakfastVal = "PREPAID MP A";
      drink1Val = "PREPAID MP A";
      drink2Val = "NA";
    }

    const preorderObj: Record<
      string,
      { breakfast: string; drink1: string; drink2: string }
    > = {};
    for (let i = 1; i <= nightsCount; i++) {
      preorderObj[`night${i}`] = {
        breakfast: breakfastVal,
        drink1: drink1Val,
        drink2: drink2Val,
      };
    }
    preorderEntries[`/preorder/${newOccId}`] = preorderObj;
  }

  // 12) /completedTasks occupant
  const completedTasksPayload = {
    bagStorage: "false",
    complimentaryEveningDrink: isSixAlphaNumeric(trimmedCode) ? "false" : "na",
    complimentaryBreakfast: isSixAlphaNumeric(trimmedCode) ? "false" : "na",
    digitalAssistant: "false",
    hero: "false",
    mainDoorAccess: "false",
  };

  // 13) /guestsByBooking occupant
  const guestsByBookingPayload = { reservationCode: trimmedCode };

  // 14) read & merge occupant ID in /roomsByDate
  const roomsByDatePaths: Array<{ path: string; newGuestIds: string[] }> = [];
  for (const rNum of roomNumbers) {
    const indexedRoom = `index_${rNum}`;
    const rbdPath = `roomsByDate/${checkInDate}/${indexedRoom}/${rNum}`;
    const snapshot = await get(ref(database, rbdPath));
    const oldRecord = snapshot.exists()
      ? (snapshot.val() as Record<string, unknown>)
      : {};
    const oldGuestIds = Array.isArray(oldRecord.guestIds)
      ? oldRecord.guestIds
      : [];
    const newGuestIds = Array.from(new Set([...oldGuestIds, newOccId]));
    roomsByDatePaths.push({ path: `/${rbdPath}/guestIds`, newGuestIds });
  }

  // 15) Build updates
  const updates: Record<string, unknown> = {
    // occupant core info
    [`/bookings/${trimmedCode}/${newOccId}`]: occupantPayload,
    [`/guestsDetails/${trimmedCode}/${newOccId}`]: mergedGuestDetails,

    // replicate occupant's activities
    ...newActivitiesEntries,
    ...newActivitiesByCodeEntries,

    // checkin + checkout
    [`/checkins/${checkInDate}/${newOccId}`]: checkInPayload,
    [`/checkouts/${checkOutDate}/${newOccId}`]: checkOutPayload,

    // city tax
    [`/cityTax/${trimmedCode}/${newOccId}`]: cityTaxPayload,

    // guestByRoom
    [`/guestByRoom/${newOccId}`]: guestByRoomPayload,

    // bagStorage
    [`/bagStorage/${newOccId}`]: bagStoragePayload,

    // optional preorder
    ...preorderEntries,

    // completedTasks
    [`/completedTasks/${newOccId}`]: completedTasksPayload,

    // guestsByBooking
    [`/guestsByBooking/${newOccId}`]: guestsByBookingPayload,
  };

  // 16) Merge occupant into /roomsByDate
  for (const rbd of roomsByDatePaths) {
    updates[rbd.path] = rbd.newGuestIds;
  }

  // 17) Single atomic update
  await update(ref(database), updates);
}

/**
 * Return type for the custom hook below.
 */
export interface UseAddGuestToBookingMutationResult {
  /**
   * Creates a new occupant by replicating data from an existing occupant
   * of a booking, but with some personal info overrides.
   * The newly created occupant will have identical checkInDate, checkOutDate,
   * rooms, and activity logs. City tax is computed as nights * 2.5.
   *
   * @param reservationCode     - e.g. "ABC123"
   * @param existingOccupantId  - occupant ID to replicate
   * @param occupantOverrides   - override occupant’s personal fields
   * @param options             - future expansions
   */
  addReplicatedGuestToBooking: (
    reservationCode: string,
    existingOccupantId: string,
    occupantOverrides?: Partial<ExistingGuestPersonalDetails>,
    options?: AddGuestOptions
  ) => Promise<void>;
}

/**
 * Controller Hook (entry point):
 * Provides a function that replicates an existing occupant's data
 * and adds a new occupant. Useful for "Add Guest to the same booking" flows,
 * ensuring the same rooms, nights, and city tax, with minimal user input.
 *
 * Example:
 *   const { addReplicatedGuestToBooking } = useAddGuestToBookingMutation();
 *
 *   async function handleAddGuest() {
 *     try {
 *       await addReplicatedGuestToBooking("AB12CD", "occ_1740508445159", {
 *         firstName: "New",
 *         lastName: "Guest"
 *       });
 *       alert("Added occupant successfully");
 *     } catch (e) {
 *       console.error(e);
 *       alert("Failed to add occupant");
 *     }
 *   }
 */
export default function useAddGuestToBookingMutation(): UseAddGuestToBookingMutationResult {
  const database = useFirebaseDatabase() as Database;

  const addReplicatedGuestToBooking = useCallback(
    async (
      reservationCode: string,
      existingOccupantId: string,
      occupantOverrides: Partial<ExistingGuestPersonalDetails> = {},
      options: AddGuestOptions = {}
    ) => {
      await addReplicatedGuest(
        database,
        reservationCode,
        existingOccupantId,
        occupantOverrides,
        options
      );
    },
    [database]
  );

  return {
    addReplicatedGuestToBooking,
  };
}
