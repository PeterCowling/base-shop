// src/components/guestDetails/Row3.tsx
import React, {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system";

import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";

import DOBSection from "./DOBSection";

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
    (value: string) => {
      setDocumentType(value as DocType);
    },
    []
  );


  return (
    <div className="flex flex-wrap gap-12 mb-75px">
      {/* Document Number */}
      <div className="flex flex-col w-300px">
        <label
          htmlFor="documentNumber"
          className="block mb-1 font-semibold text-info-dark"
        >
          Document Number
        </label>
        <Input compatibilityMode="no-wrapper"
          id="documentNumber"
          type="text"
          value={documentNumber}
          onChange={handleDocNumberChange}
          onBlur={saveDocNumber}
          onKeyDown={handleDocNumberKeyDown}
          className={`border border-info-light rounded px-3 py-2 w-300px focus:outline-none focus:ring-2 focus:ring-primary-main ${
            isDocNumberPopulated ? "bg-success-light/50" : ""
          } text-foreground`}
        />
      </div>

      {/* Document Type (Dropdown) */}
      <div className="flex flex-col w-300px">
        <label
          htmlFor="documentType"
          className="block mb-1 font-semibold text-info-dark"
        >
          Document Type
        </label>
        <Select
          value={documentType || undefined}
          onValueChange={(value) => {
            handleDocTypeChange(value);
            if (value !== occupantDetails?.document?.type) {
              void saveField("document/type", value).then(() => {
                setSnackbar({ open: true, message: "Document type updated successfully!", severity: "success" });
              }).catch((err: unknown) => {
                if (err instanceof Error) {
                  setSnackbar({ open: true, message: `Error updating document type: ${err.message}`, severity: "error" });
                } else {
                  setSnackbar({ open: true, message: "Error updating document type due to an unknown error.", severity: "error" });
                }
              });
            }
          }}
        >
          <SelectTrigger
            id="documentType"
            className={`border border-info-light rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-main transition-shadow ${
              isDocTypePopulated
                ? "bg-success-light/50"
                : "bg-surface"
            } text-foreground hover:border-primary-dark`}
          >
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date of Birth */}
      <div className="flex flex-col w-300px">
        <DOBSection occupantDetails={occupantDetails} saveField={saveField} />
      </div>
    </div>
  );
}

export default React.memo(Row3);
