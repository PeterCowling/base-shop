// src/components/docInsert/row1.tsx
import React, {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";

import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";

/**
 * Restrict occupantDetails to only the fields Row1 actually handles.
 * This ensures that occupantDetails[field] is always a string or undefined,
 * avoiding type conflicts with DateOfBirth or OccupantDocument.
 */
type Row1OccupantDetails = Pick<
  OccupantDetails,
  "firstName" | "lastName" | "gender"
>;

/**
 * Define the SnackbarState for convenience
 */
interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

/**
 * Props for Row1, now taking Row1OccupantDetails instead of OccupantDetails
 */
interface Row1Props {
  occupantDetails: Row1OccupantDetails;
  saveField: (
    fieldName: keyof Row1OccupantDetails,
    value: string
  ) => Promise<void>;
  setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>;
}

/**
 * Utility to capitalize the first letter and lowercase the rest.
 */
function transformName(input: string): string {
  if (!input) return "";
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

/**
 * Row1: First Name, Last Name, Gender
 *
 * Uses a local occupant object and a set of dirty fields to prevent
 * overwriting user input until the data from Firebase is confirmed
 * to be updated (i.e., occupantDetails matches what we saved).
 */
function Row1({ occupantDetails, saveField, setSnackbar }: Row1Props) {
  // Combine occupant fields into one local state object
  const [localOccupant, setLocalOccupant] = useState<Row1OccupantDetails>({
    firstName: occupantDetails.firstName ?? "",
    lastName: occupantDetails.lastName ?? "",
    gender: occupantDetails.gender ?? "",
  });

  // Track which fields have been modified locally (dirty)
  const [dirtyFields, setDirtyFields] = useState<
    Set<keyof Row1OccupantDetails>
  >(() => new Set());

  /**
   * Whenever occupantDetails changes, sync localOccupant for fields
   * that are NOT dirty. (Dirty fields preserve user input.)
   */
  useEffect(() => {
    // For each field that Row1 manages, if it's not dirty, sync from occupantDetails
    (
      ["firstName", "lastName", "gender"] as (keyof Row1OccupantDetails)[]
    ).forEach((field) => {
      // If not dirty, and occupantDetails differs from local state, update local
      if (!dirtyFields.has(field)) {
        setLocalOccupant((prev) => {
          const currentVal = prev[field] ?? "";
          const newVal = occupantDetails[field] ?? "";
          if (currentVal !== newVal) {
            return {
              ...prev,
              [field]: newVal,
            } as Row1OccupantDetails;
          }
          return prev;
        });
      }
    });
  }, [occupantDetails, dirtyFields]);

  /**
   * Show an error via the parent setSnackbar
   */
  const showError = useCallback(
    (message: string): void => {
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    },
    [setSnackbar]
  );

  /**
   * onBlur handler: if the field changed vs occupantDetails, call saveField.
   */
  const handleBlur = useCallback(
    async (fieldName: keyof Row1OccupantDetails) => {
      const localValue = localOccupant[fieldName] ?? "";
      const remoteValue = occupantDetails[fieldName] ?? "";

      // If local matches remote, do nothing
      if (localValue === remoteValue) return;

      // Attempt to update
      try {
        await saveField(fieldName, localValue);
        setSnackbar({
          open: true,
          message: `${fieldName} updated successfully!`,
          severity: "success",
        });
        // NOTE: We do NOT remove the field from dirtyFields here.
        // We'll let occupantDetails refresh from Firebase,
        // triggering useEffect, which sees the new occupantDetails
        // and removes the field from dirty if they match.
      } catch (err) {
        if (err instanceof Error) {
          showError(`Failed to update ${fieldName}: ${err.message}`);
        } else {
          showError(`Failed to update ${fieldName} due to an unknown error.`);
        }
      }
    },
    [localOccupant, occupantDetails, saveField, setSnackbar, showError]
  );

  /**
   * Handle changes to firstName
   */
  const handleChangeFirstName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = transformName(e.target.value);
      setLocalOccupant((prev) => ({
        ...prev,
        firstName: value,
      }));
      setDirtyFields((prev) => new Set([...prev, "firstName"]));
    },
    []
  );

  /**
   * Handle changes to lastName
   */
  const handleChangeLastName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = transformName(e.target.value);
      setLocalOccupant((prev) => ({
        ...prev,
        lastName: value,
      }));
      setDirtyFields((prev) => new Set([...prev, "lastName"]));
    },
    []
  );

  /**
   * Handle changes to gender
   */
  const handleChangeGender = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setLocalOccupant((prev) => ({
        ...prev,
        gender: value,
      }));
      setDirtyFields((prev) => new Set([...prev, "gender"]));
    },
    []
  );

  // Simple checks for UI styling
  const isFirstNamePopulated = (localOccupant.firstName ?? "").trim() !== "";
  const isLastNamePopulated = (localOccupant.lastName ?? "").trim() !== "";
  const isGenderPopulated = (localOccupant.gender ?? "").trim() !== "";

  // Placeholder checks for conditional warning styling
  const isFirstNamePlaceholder =
    (localOccupant.firstName ?? "").trim().toLowerCase() === "to be";
  const isLastNamePlaceholder =
    (localOccupant.lastName ?? "").trim().toLowerCase() === "confirmed";

  return (
    <>
      <div className="flex flex-wrap gap-12 mt-[100px] mb-[75px] dark:text-darkAccentGreen">
        {/* First Name */}
        <div className="flex flex-col w-[300px]">
          <label
            htmlFor="firstName"
            className="block mb-1 font-semibold text-info-dark dark:text-darkAccentGreen"
          >
            First Name
          </label>
          <input
            id="firstName"
            className={`border border-info-light rounded px-3 py-2 w-[300px] focus:outline-none focus:ring-1 focus:ring-primary-main dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen ${
              isFirstNamePlaceholder
                ? "bg-warning-light/50"
                : isFirstNamePopulated
                ? "bg-success-light/50"
                : ""
            }`}
            value={localOccupant.firstName ?? ""}
            onChange={handleChangeFirstName}
            onBlur={() => handleBlur("firstName")}
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col w-[300px]">
          <label
            htmlFor="lastName"
            className="block mb-1 font-semibold text-info-dark dark:text-darkAccentGreen"
          >
            Last Name
          </label>
          <input
            id="lastName"
            className={`border border-info-light rounded px-3 py-2 w-[300px] focus:outline-none focus:ring-1 focus:ring-primary-main dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen ${
              isLastNamePlaceholder
                ? "bg-warning-light/50"
                : isLastNamePopulated
                ? "bg-success-light/50"
                : ""
            }`}
            value={localOccupant.lastName ?? ""}
            onChange={handleChangeLastName}
            onBlur={() => handleBlur("lastName")}
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col w-[300px]">
          <label
            htmlFor="gender"
            className="block mb-1 font-semibold text-info-dark dark:text-darkAccentGreen"
          >
            Gender
          </label>
          <select
            id="gender"
            className={`border border-info-light rounded px-3 py-2 w-[300px] focus:outline-none focus:ring-1 focus:ring-primary-main dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen ${
              isGenderPopulated ? "bg-success-light/50" : ""
            }`}
            value={localOccupant.gender ?? ""}
            onChange={handleChangeGender}
            onBlur={() => handleBlur("gender")}
          >
            <option value="">(select one)</option>
            <option value="F">F</option>
            <option value="M">M</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default memo(Row1);
