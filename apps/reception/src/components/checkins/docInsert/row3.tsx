// src/components/guestDetails/Row3.tsx
import { ChevronDown } from "lucide-react";
import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import DOBSection from "./DOBSection";
import { OccupantDetails } from "../../../types/hooks/data/guestDetailsData";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

interface Row3Props {
  occupantDetails: OccupantDetails;
  saveField: (fieldName: string, value: unknown) => Promise<void>;
  setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>;
}

/**
 * Available document types.
 * Keep alphabetically sorted for easier maintenance.
 */
const DOC_TYPE_OPTIONS = ["Drivers License", "ID Card", "Passport"] as const;

type DocType = (typeof DOC_TYPE_OPTIONS)[number];

/**
 * Row3: Document Number, Document Type (dropdown), and DOB
 */
function Row3({
  occupantDetails,
  saveField,
  setSnackbar,
}: Row3Props): JSX.Element {
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentType, setDocumentType] = useState<DocType | "">("");

  useEffect(() => {
    setDocumentNumber(occupantDetails?.document?.number ?? "");
    setDocumentType(
      (occupantDetails?.document?.type as DocType | undefined) ?? ""
    );
  }, [occupantDetails]);

  const isDocNumberPopulated = occupantDetails?.document?.number?.trim() !== "";
  const isDocTypePopulated = occupantDetails?.document?.type?.trim() !== "";

  /**
   * Handle typing in the "Document Number" field:
   * - Automatically uppercase letters
   * - Update local state
   */
  const handleDocNumberChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      // Transform to uppercase
      const uppercaseValue = e.target.value.toUpperCase();
      setDocumentNumber(uppercaseValue);
    },
    []
  );

  /**
   * The same "save" logic for blur or Enter press.
   */
  const saveDocNumber = useCallback(async () => {
    // If unchanged, do nothing
    if (documentNumber === occupantDetails?.document?.number) {
      return;
    }
    try {
      await saveField("document/number", documentNumber);
      setSnackbar({
        open: true,
        message: "Document number updated successfully!",
        severity: "success",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSnackbar({
          open: true,
          message: `Error updating document number: ${err.message}`,
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Error updating document number due to an unknown error.",
          severity: "error",
        });
      }
    }
  }, [
    documentNumber,
    occupantDetails?.document?.number,
    saveField,
    setSnackbar,
  ]);

  /**
   * If user presses Enter in the Document Number field, save immediately.
   */
  const handleDocNumberKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        // Prevent form submission or losing focus if any
        e.preventDefault();
        void saveDocNumber();
      }
    },
    [saveDocNumber]
  );

  /**
   * Handle dropdown selection change for document type.
   */
  const handleDocTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setDocumentType(e.target.value as DocType);
    },
    []
  );

  /**
   * Save logic for document type (on blur).
   */
  const handleDocTypeBlur = useCallback(async () => {
    if (documentType === occupantDetails?.document?.type) {
      return;
    }
    try {
      await saveField("document/type", documentType);
      setSnackbar({
        open: true,
        message: "Document type updated successfully!",
        severity: "success",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSnackbar({
          open: true,
          message: `Error updating document type: ${err.message}`,
          severity: "error",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Error updating document type due to an unknown error.",
          severity: "error",
        });
      }
    }
  }, [documentType, occupantDetails?.document?.type, saveField, setSnackbar]);

  return (
    <div className="flex flex-wrap gap-12 mb-[75px]">
      {/* Document Number */}
      <div className="flex flex-col w-[300px]">
        <label
          htmlFor="documentNumber"
          className="block mb-1 font-semibold text-info-dark"
        >
          Document Number
        </label>
        <input
          id="documentNumber"
          type="text"
          value={documentNumber}
          onChange={handleDocNumberChange}
          onBlur={saveDocNumber}
          onKeyDown={handleDocNumberKeyDown}
          className={`border border-info-light rounded px-3 py-2 w-[300px] focus:outline-none focus:ring-2 focus:ring-primary-main ${
            isDocNumberPopulated ? "bg-success-light/50" : ""
          } text-gray-900`}
        />
      </div>

      {/* Document Type (Dropdown) */}
      <div className="flex flex-col w-[300px]">
        <label
          htmlFor="documentType"
          className="block mb-1 font-semibold text-info-dark"
        >
          Document Type
        </label>
        {/* Wrapper adds custom icon and positions it */}
        <div className="relative w-[300px]">
          <select
            id="documentType"
            value={documentType}
            onChange={handleDocTypeChange}
            onBlur={handleDocTypeBlur}
            className={`appearance-none border border-info-light rounded px-3 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-primary-main transition-shadow ${
              isDocTypePopulated
                ? "bg-success-light/50"
                : "bg-white dark:bg-darkSurface"
            } text-gray-900 hover:border-primary-dark`}
          >
            <option value="" disabled>
              Select document type
            </option>
            {DOC_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {/* Chevron icon */}
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-info-dark">
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="flex flex-col w-[300px]">
        <DOBSection occupantDetails={occupantDetails} saveField={saveField} />
      </div>
    </div>
  );
}

export default React.memo(Row3);
