// src/components/docInsert/row1.tsx
import React, {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system";
import { Inline } from "@acme/design-system/primitives";

import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";

const ROW1_FIELDS = ["firstName", "lastName", "gender"] as const;
const INPUT_BASE_CLASS =
  "border border-info-light rounded-lg px-3 py-2 w-300px focus:outline-none focus:ring-1 focus:ring-primary-main";

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
    ROW1_FIELDS.forEach((field) => {
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
        setSnackbar({
          open: true,
          message:
            err instanceof Error
              ? `Failed to update ${fieldName}: ${err.message}`
              : `Failed to update ${fieldName} due to an unknown error.`,
          severity: "error",
        });
      }
    },
    [localOccupant, occupantDetails, saveField, setSnackbar]
  );

  /**
   * Unified change handler for firstName and lastName (both apply transformName).
   */
  const handleChangeName = useCallback(
    (field: "firstName" | "lastName", e: ChangeEvent<HTMLInputElement>) => {
      const value = transformName(e.target.value);
      setLocalOccupant((prev) => ({ ...prev, [field]: value }));
      setDirtyFields((prev) => new Set([...prev, field]));
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
      <Inline gap={12} className="mt-100px mb-75px">
        {/* First Name */}
        <div className="flex flex-col w-300px">
          <label
            htmlFor="firstName"
            className="block mb-1 font-semibold text-info-dark"
          >
            First Name
          </label>
          <Input
            compatibilityMode="no-wrapper"
            id="firstName"
            className={`${INPUT_BASE_CLASS} ${
              isFirstNamePlaceholder
                ? "bg-warning-light/50"
                : isFirstNamePopulated
                ? "bg-success-light/50"
                : ""
            }`}
            value={localOccupant.firstName ?? ""}
            onChange={(e) => handleChangeName("firstName", e)}
            onBlur={() => handleBlur("firstName")}
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col w-300px">
          <label
            htmlFor="lastName"
            className="block mb-1 font-semibold text-info-dark"
          >
            Last Name
          </label>
          <Input
            compatibilityMode="no-wrapper"
            id="lastName"
            className={`${INPUT_BASE_CLASS} ${
              isLastNamePlaceholder
                ? "bg-warning-light/50"
                : isLastNamePopulated
                ? "bg-success-light/50"
                : ""
            }`}
            value={localOccupant.lastName ?? ""}
            onChange={(e) => handleChangeName("lastName", e)}
            onBlur={() => handleBlur("lastName")}
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col w-300px">
          <label
            htmlFor="gender"
            className="block mb-1 font-semibold text-info-dark"
          >
            Gender
          </label>
          <Select
            value={localOccupant.gender || undefined}
            onValueChange={(value) => {
              setLocalOccupant((prev) => ({ ...prev, gender: value }));
              setDirtyFields((prev) => new Set([...prev, "gender"]));
              if (value !== (occupantDetails.gender ?? "")) {
                void saveField("gender", value)
                  .then(() => {
                    setSnackbar({
                      open: true,
                      message: "gender updated successfully!",
                      severity: "success",
                    });
                  })
                  .catch((err: unknown) => {
                    setSnackbar({
                      open: true,
                      message: `Failed to update gender: ${err instanceof Error ? err.message : "unknown error"}`,
                      severity: "error",
                    });
                  });
              }
            }}
          >
            <SelectTrigger
              id="gender"
              className={`${INPUT_BASE_CLASS} ${isGenderPopulated ? "bg-success-light/50" : ""}`}
            >
              <SelectValue placeholder="(select one)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="F">F</SelectItem>
              <SelectItem value="M">M</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Inline>
    </>
  );
}

export default memo(Row1);
