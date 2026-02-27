// src/components/docInsert/DOBSection.tsx
import React, {
  type ChangeEvent,
  type FocusEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Input } from "@acme/design-system";
import { ConfirmDialog } from "@acme/design-system/atoms";

import { useAuth } from "../../../context/AuthContext";
import { canAccess, Permissions } from "../../../lib/roles";
import { occupantDetailsSchema } from "../../../schemas/occupantDetailsSchema";
import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";
import { showToast } from "../../../utils/toastUtils";

interface DOBSectionProps {
  occupantDetails: OccupantDetails;
  saveField: (fieldName: string, value: unknown) => Promise<void>;
}

/**
 * DOBSection: Collect and validate day, month, and year, skipping min/max age checks if allocated room = "7".
 * In addition, users with MANAGEMENT_ACCESS may override the age restriction after confirmation.
 */
function DOBSection({
  occupantDetails,
  saveField,
}: DOBSectionProps): JSX.Element {
  const { user } = useAuth();

  const [yyyy, setYyyy] = useState("");
  const [mm, setMm] = useState("");
  const [dd, setDd] = useState("");
  const [bgSuccess, setBgSuccess] = useState(false);
  const [dobError, setDobError] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [pendingOverrideDob, setPendingOverrideDob] = useState<{
    yyyy: string;
    mm: string;
    dd: string;
  } | null>(null);

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

  const saveDob = useCallback(
    (nextYyyy: string, nextMm: string, nextDd: string) => {
      saveField("dateOfBirth", { yyyy: nextYyyy, mm: nextMm, dd: nextDd })
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
    [saveField]
  );

  const handleOverrideOpenChange = useCallback(
    (open: boolean) => {
      setOverrideDialogOpen(open);
      if (!open && pendingOverrideDob) {
        setPendingOverrideDob(null);
        revertDOB();
      }
    },
    [pendingOverrideDob, revertDOB]
  );

  const handleOverrideConfirm = useCallback(() => {
    if (!pendingOverrideDob) {
      return;
    }
    const overrideDob = pendingOverrideDob;
    setPendingOverrideDob(null);
    setOverrideDialogOpen(false);
    saveDob(overrideDob.yyyy, overrideDob.mm, overrideDob.dd);
  }, [pendingOverrideDob, saveDob]);

  /**
   * On blur, if all fields are filled, validate. If invalid, revert unless user has MANAGEMENT_ACCESS and confirms override.
   */
  const handleBlur = useCallback(
    async (_e: FocusEvent<HTMLInputElement>) => {
      if (!yyyy || !mm || !dd) return;

      const errorMsg = validateDOB(yyyy, mm, dd);
      if (errorMsg) {
        setDobError(errorMsg);
        showToast(errorMsg, "error");
        setBgSuccess(false);

        const canOverride = canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS);

        // If user is allowed an override, prompt for confirmation.
        if (canOverride) {
          setPendingOverrideDob({
            yyyy,
            mm,
            dd,
          });
          setOverrideDialogOpen(true);
          return;
        } else {
          revertDOB();
          return;
        }
      }

      // Valid date or override accepted.
      saveDob(yyyy, mm, dd);
    },
    [yyyy, mm, dd, validateDOB, user, revertDOB, saveDob]
  );

  return (
    <>
      <label htmlFor="dob" className="block mb-1 font-semibold text-info-dark">
        Date of Birth
      </label>
      <div className="flex gap-2 items-center">
        {/* YEAR */}
        <Input compatibilityMode="no-wrapper"
          id="dob-year"
          type="text"
          placeholder="YYYY"
          maxLength={4}
          className={`w-[70px] border border-info-light rounded-lg px-3 py-2 
            focus:outline-none focus:ring-1 focus:ring-primary-main 
            ${bgSuccess ? "bg-success-light/50" : ""} text-foreground`}
          value={yyyy}
          onChange={(e) => handleNumericChange(e, setYyyy, 4)}
          onBlur={handleBlur}
        />
        <span>/</span>

        {/* MONTH */}
        <Input compatibilityMode="no-wrapper"
          id="dob-month"
          type="text"
          placeholder="MM"
          maxLength={2}
          className={`w-[50px] border border-info-light rounded-lg px-3 py-2 
            focus:outline-none focus:ring-1 focus:ring-primary-main 
            ${bgSuccess ? "bg-success-light/50" : ""} text-foreground`}
          value={mm}
          onChange={(e) => handleNumericChange(e, setMm, 2)}
          onBlur={handleBlur}
        />
        <span>/</span>

        {/* DAY */}
        <Input compatibilityMode="no-wrapper"
          id="dob-day"
          type="text"
          placeholder="DD"
          maxLength={2}
          className={`w-[50px] border border-info-light rounded-lg px-3 py-2 
            focus:outline-none focus:ring-1 focus:ring-primary-main 
            ${bgSuccess ? "bg-success-light/50" : ""} text-foreground`}
          value={dd}
          onChange={(e) => handleNumericChange(e, setDd, 2)}
          onBlur={handleBlur}
        />
      </div>

      {dobError && <p className="text-error-main text-sm mt-1">{dobError}</p>}
      <ConfirmDialog
        open={overrideDialogOpen}
        onOpenChange={handleOverrideOpenChange}
        title="Override invalid date?"
        description={dobError}
        confirmLabel="Override"
        onConfirm={handleOverrideConfirm}
      />
    </>
  );
}

export default React.memo(DOBSection);
