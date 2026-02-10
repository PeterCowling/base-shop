import { useCallback, useState } from "react";
import { get, ref, update } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { PreorderEntry } from "../../types/hooks/data/preorderData";
import type {
  PrimeRequestRecord,
  PrimeRequestStatus,
} from "../../types/hooks/data/primeRequestsData";
import { useBookingDatesMutator } from "../mutations/useChangeBookingDatesMutator";
import usePreorderMutations from "../mutations/usePreorderMutations";

const ACTIONABLE_STATUSES = new Set<PrimeRequestStatus>([
  "approved",
  "completed",
]);

interface ResolvePrimeRequestInput {
  request: PrimeRequestRecord;
  nextStatus: PrimeRequestStatus;
  resolutionNote?: string;
}

interface BookingOccupantRecord {
  checkInDate?: string;
  checkOutDate?: string;
}

interface PrimeMealChangePayload {
  service?: unknown;
  serviceDate?: unknown;
  requestedValue?: unknown;
  currentNightKey?: unknown;
}

interface PrimeBagDropPayload {
  pickupWindow?: unknown;
}

function asStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveOperator(input: {
  uid?: string;
  email?: string;
  user_name?: string;
  displayName?: string;
}) {
  const fallbackIdentity = "system@reception.local";
  const operatorId = input.uid ?? input.email ?? fallbackIdentity;
  const operatorName =
    input.displayName ?? input.user_name ?? input.email ?? "System";
  return { operatorId, operatorName };
}

function toPreorderRecord(
  existing: Record<string, unknown> | null,
  fallbackServiceDate: string | null,
  fallbackNightKey: string,
): PreorderEntry {
  const next: PreorderEntry = {
    breakfast: asStringOrNull(existing?.breakfast) ?? "NA",
    drink1: asStringOrNull(existing?.drink1) ?? "NA",
    drink2: asStringOrNull(existing?.drink2) ?? "NA",
    night: asStringOrNull(existing?.night) ?? fallbackNightKey,
    serviceDate:
      asStringOrNull(existing?.serviceDate) ?? fallbackServiceDate ?? undefined,
  };
  return next;
}

function findNightKeyByServiceDate(
  preorder: Record<string, unknown>,
  serviceDate: string,
): string | null {
  const matchingEntry = Object.entries(preorder).find(([, value]) => {
    if (!value || typeof value !== "object") {
      return false;
    }
    const record = value as Record<string, unknown>;
    return (
      asStringOrNull(record.serviceDate) === serviceDate ||
      asStringOrNull(record.night) === serviceDate
    );
  });

  return matchingEntry?.[0] ?? null;
}

export default function usePrimeRequestResolution() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const { updateBookingDates } = useBookingDatesMutator();
  const { savePreorder } = usePreorderMutations();
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const resolveRequest = useCallback(
    async ({
      request,
      nextStatus,
      resolutionNote,
    }: ResolvePrimeRequestInput): Promise<void> => {
      setIsResolving(true);
      setError(null);

      try {
        const requestPath = `primeRequests/byId/${request.requestId}`;
        const requestSnap = await get(ref(database, requestPath));
        if (!requestSnap.exists()) {
          throw new Error(`Prime request ${request.requestId} not found`);
        }

        const currentRecord = requestSnap.val() as PrimeRequestRecord;
        const now = Date.now();
        const operator = resolveOperator(user ?? undefined);
        const trimmedNote = asStringOrNull(resolutionNote);

        if (
          currentRecord.type === "extension" &&
          ACTIONABLE_STATUSES.has(nextStatus)
        ) {
          const payload =
            (currentRecord.payload as Record<string, unknown> | undefined) ??
            {};
          const requestedCheckOutDate = asStringOrNull(
            payload.requestedCheckOutDate,
          );
          if (!requestedCheckOutDate) {
            throw new Error("Extension request is missing requestedCheckOutDate");
          }

          const bookingPath = `bookings/${currentRecord.bookingId}/${currentRecord.guestUuid}`;
          const occupantSnap = await get(ref(database, bookingPath));
          if (!occupantSnap.exists()) {
            throw new Error("Booking occupant for extension request not found");
          }

          const occupant = occupantSnap.val() as BookingOccupantRecord;
          if (!occupant.checkInDate || !occupant.checkOutDate) {
            throw new Error("Booking occupant dates are incomplete");
          }

          if (requestedCheckOutDate > occupant.checkOutDate) {
            await updateBookingDates({
              bookingRef: currentRecord.bookingId,
              occupantId: currentRecord.guestUuid,
              oldCheckIn: occupant.checkInDate,
              oldCheckOut: occupant.checkOutDate,
              newCheckIn: occupant.checkInDate,
              newCheckOut: requestedCheckOutDate,
              extendedPrice: "0",
            });
          }
        }

        if (
          currentRecord.type === "meal_change_exception" &&
          ACTIONABLE_STATUSES.has(nextStatus)
        ) {
          const payload = (currentRecord.payload ?? {}) as PrimeMealChangePayload;
          const service = asStringOrNull(payload.service);
          const requestedValue = asStringOrNull(payload.requestedValue);
          const serviceDate = asStringOrNull(payload.serviceDate);
          const currentNightKey = asStringOrNull(payload.currentNightKey);

          if (!service || !requestedValue) {
            throw new Error(
              "Meal-change request missing service or requestedValue",
            );
          }

          const preorderPath = `preorder/${currentRecord.guestUuid}`;
          const preorderSnap = await get(ref(database, preorderPath));
          const preorderData = preorderSnap.exists()
            ? (preorderSnap.val() as Record<string, unknown>)
            : {};

          const derivedNightKey =
            (currentNightKey && preorderData[currentNightKey]
              ? currentNightKey
              : null) ??
            (serviceDate ? findNightKeyByServiceDate(preorderData, serviceDate) : null) ??
            `night${Object.keys(preorderData).length + 1}`;

          const existingRecord =
            preorderData[derivedNightKey] &&
            typeof preorderData[derivedNightKey] === "object"
              ? (preorderData[derivedNightKey] as Record<string, unknown>)
              : null;

          const nextPreorder = toPreorderRecord(
            existingRecord,
            serviceDate,
            derivedNightKey,
          );

          if (service === "breakfast") {
            nextPreorder.breakfast = requestedValue;
          } else if (service === "drink") {
            nextPreorder.drink1 = requestedValue;
          } else {
            throw new Error(`Unsupported meal-change service: ${service}`);
          }

          await savePreorder(currentRecord.guestUuid, derivedNightKey, nextPreorder);
        }

        if (currentRecord.type === "bag_drop") {
          const payload = (currentRecord.payload ?? {}) as PrimeBagDropPayload;
          const pickupWindow = asStringOrNull(payload.pickupWindow);
          await update(ref(database, `bagStorage/${currentRecord.guestUuid}`), {
            optedIn: true,
            requestStatus: nextStatus,
            requestId: currentRecord.requestId,
            pickupWindow: pickupWindow ?? undefined,
            updatedAt: now,
          });
        }

        const nextRecord: PrimeRequestRecord = {
          ...currentRecord,
          status: nextStatus,
          updatedAt: now,
          resolution: {
            operatorId: operator.operatorId,
            operatorName: operator.operatorName,
            resolvedAt: now,
            ...(trimmedNote ? { note: trimmedNote } : {}),
          },
        };

        const updates: Record<string, unknown> = {
          [`primeRequests/byId/${request.requestId}`]: nextRecord,
        };

        if (currentRecord.status !== nextStatus) {
          updates[
            `primeRequests/byStatus/${currentRecord.status}/${request.requestId}`
          ] = null;
          updates[`primeRequests/byStatus/${nextStatus}/${request.requestId}`] =
            true;
        }

        await update(ref(database), updates);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsResolving(false);
      }
    },
    [database, savePreorder, updateBookingDates, user],
  );

  return {
    resolveRequest,
    isResolving,
    error,
  };
}
