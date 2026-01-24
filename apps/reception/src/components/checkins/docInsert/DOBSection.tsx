// src/components/docInsert/DOBSection.tsx
import React, {
  type ChangeEvent,
  type FocusEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../../context/AuthContext";
import { useDialog } from "../../../context/DialogContext";
import { occupantDetailsSchema } from "../../../schemas/occupantDetailsSchema";
import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";
import { showToast } from "../../../utils/toastUtils";

interface DOBSectionProps {
  occupantDetails: OccupantDetails;
  saveField: (fieldName: string, value: unknown) => Promise<void>;
}

/**
 * Users allowed to override the 18–39 age restriction.
 * Keep alphabetically sorted for easier maintenance.
 */
const ALLOWED_OVERRIDE_USERS = [
  "Allessandro",
  "Cristiana",
  "Pete",
  "Serena",
] as const;

type AllowedOverrideUser = (typeof ALLOWED_OVERRIDE_USERS)[number];

/**
 * DOBSection: Collect and validate day, month, and year, skipping min/max age checks if allocated room = "7".
 * In addition, users in `ALLOWED_OVERRIDE_USERS` may override the age restriction after confirmation.
 */
function DOBSection({
  occupantDetails,
  saveField,
}: DOBSectionProps): JSX.Element {
  const { user } = useAuth();
  const { showConfirm } = useDialog();

  const [yyyy, setYyyy] = useState("");
  const [mm, setMm] = useState("");
  const [dd, setDd] = useState("");
  const [bgSuccess, setBgSuccess] = useState(false);
  const [dobError, setDobError] = useState("");

  /**
   * Load occupant DOB or reset if occupantDetails changes
   */
  useEffect(() => {
    const occupantDOB = occupantDetails?.dateOfBirth;
    if (!occupantDOB) {
      setYyyy("");
      setMm("");
      setDd("");
      setBgSuccess(false);
      setDobError("");
      return;
    }
    setYyyy(occupantDOB.yyyy ?? "");
    setMm(occupantDOB.mm ?? "");
    setDd(occupantDOB.dd ?? "");
    setBgSuccess(Boolean(occupantDOB.yyyy && occupantDOB.mm && occupantDOB.dd));
    setDobError("");
  }, [occupantDetails]);

  /**
   * Generic numeric-change handler
   */
  const handleNumericChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string>>,
      maxLen: number
    ) => {
      const numericInput = e.target.value.replace(/\D/g, "");
      const limited = numericInput.slice(0, maxLen);
      setter(limited);
      setBgSuccess(false);
      setDobError("");
    },
    []
  );

  /**
   * Validate the full DOB. Return an error message if invalid, otherwise null.
   * If occupant is allocated to room "7", skip the min/max age constraints.
   */
  const validateDOB = useCallback(
    (year: string, month: string, day: string): string | null => {
      const result = occupantDetailsSchema.safeParse({
        allocated: occupantDetails.allocated,
        dateOfBirth: { yyyy: year, mm: month, dd: day },
      });
      if (result.success) return null;
      return result.error.errors[0]?.message ?? "Invalid date";
    },
    [occupantDetails.allocated]
  );

  /**
   * Revert occupant's DOB to existing or clear if none
   */
  const revertDOB = useCallback(() => {
    const occupantDOB = occupantDetails?.dateOfBirth;
    if (occupantDOB) {
      setYyyy(occupantDOB.yyyy ?? "");
      setMm(occupantDOB.mm ?? "");
      setDd(occupantDOB.dd ?? "");
    } else {
      setYyyy("");
      setMm("");
      setDd("");
    }
    setBgSuccess(false);
  }, [occupantDetails]);

  /**
   * On blur, if all fields are filled, validate. If invalid, revert unless user is in ALLOWED_OVERRIDE_USERS and confirms override.
   */
  const handleBlur = useCallback(
    async (_e: FocusEvent<HTMLInputElement>) => {
      if (!yyyy || !mm || !dd) return;

      const errorMsg = validateDOB(yyyy, mm, dd);
      if (errorMsg) {
        setDobError(errorMsg);
        showToast(errorMsg, "error");
        setBgSuccess(false);

        const currentUser = user?.user_name;
        const canOverride = ALLOWED_OVERRIDE_USERS.includes(
          currentUser as AllowedOverrideUser
        );

        // If user is allowed an override, prompt for confirmation.
        if (canOverride) {
          const confirmed = await showConfirm({
            title: "Override invalid date?",
            message: errorMsg,
            confirmLabel: "Override",
          });
          if (!confirmed) {
            revertDOB();
            return;
          }
          // If confirmed, proceed without reverting.
        } else {
          revertDOB();
          return;
        }
      }

      // Valid date or override accepted.
      saveField("dateOfBirth", { yyyy, mm, dd })
        .then(() => {
          showToast("Date of Birth updated successfully!", "success");
          setBgSuccess(true);
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            showToast(`Failed to update dateOfBirth: ${err.message}`, "error");
          } else {
            showToast(
              "Failed to update dateOfBirth due to an unknown error.",
              "error"
            );
          }
          setBgSuccess(false);
        });
    },
    [yyyy, mm, dd, validateDOB, user?.user_name, saveField, revertDOB, showConfirm]
  );

  return (
    <>
      <label htmlFor="dob" className="block mb-1 font-semibold text-info-dark">
        Date of Birth
      </label>
      <div className="flex gap-2 items-center">
        {/* YEAR */}
        <input
          id="dob-year"
          type="text"
          placeholder="YYYY"
          maxLength={4}
          className={`w-[70px] border border-info-light rounded px-3 py-2 
            focus:outline-none focus:ring-1 focus:ring-primary-main 
            ${bgSuccess ? "bg-success-light/50" : ""} text-gray-900`}
          value={yyyy}
          onChange={(e) => handleNumericChange(e, setYyyy, 4)}
          onBlur={handleBlur}
        />
        <span>/</span>

        {/* MONTH */}
        <input
          id="dob-month"
          type="text"
          placeholder="MM"
          maxLength={2}
          className={`w-[50px] border border-info-light rounded px-3 py-2 
            focus:outline-none focus:ring-1 focus:ring-primary-main 
            ${bgSuccess ? "bg-success-light/50" : ""} text-gray-900`}
          value={mm}
          onChange={(e) => handleNumericChange(e, setMm, 2)}
          onBlur={handleBlur}
        />
        <span>/</span>

        {/* DAY */}
        <input
          id="dob-day"
          type="text"
          placeholder="DD"
          maxLength={2}
          className={`w-[50px] border border-info-light rounded px-3 py-2 
            focus:outline-none focus:ring-1 focus:ring-primary-main 
            ${bgSuccess ? "bg-success-light/50" : ""} text-gray-900`}
          value={dd}
          onChange={(e) => handleNumericChange(e, setDd, 2)}
          onBlur={handleBlur}
        />
      </div>

      {dobError && <p className="text-error-main text-sm mt-1">{dobError}</p>}
    </>
  );
}

export default React.memo(DOBSection);
