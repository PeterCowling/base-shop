/* File: /src/components/checkins/KeycardButton/DocumentTypeSelector.tsx */
import React, { memo } from "react";
import {
  faDriversLicense,
  faIdCard,
  faPassport,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { DocumentType } from "../../../types/keycards";

/**
 * If payType=DOCUMENT, user must choose what type of document is used for deposit.
 */
interface DocumentTypeSelectorProps {
  docType: DocumentType;
  setDocType: React.Dispatch<React.SetStateAction<DocumentType>>;
}

function DocumentTypeSelector({
  docType,
  setDocType,
}: DocumentTypeSelectorProps) {
  return (
    <fieldset className="mt-2 dark:text-darkAccentGreen">
      <legend className="block mb-1 font-semibold">Document Type:</legend>
      <div className="flex flex-col gap-2">
        <DocRadioButton
          label="Passport"
          value={DocumentType.PASSPORT}
          icon={faPassport}
          currentValue={docType}
          onChange={() => setDocType(DocumentType.PASSPORT)}
        />

        <DocRadioButton
          label="Driver License"
          value={DocumentType.DRIVING_LICENSE}
          icon={faDriversLicense}
          currentValue={docType}
          onChange={() => setDocType(DocumentType.DRIVING_LICENSE)}
        />

        <DocRadioButton
          label="National ID"
          value={DocumentType.ID_CARD}
          icon={faIdCard}
          currentValue={docType}
          onChange={() => setDocType(DocumentType.ID_CARD)}
        />
      </div>
    </fieldset>
  );
}

export default memo(DocumentTypeSelector);

/* -------------------------------------------------------- */
/* A small sub-component for each doc-type radio item       */
/* -------------------------------------------------------- */
interface DocRadioButtonProps {
  label: string;
  value: DocumentType;
  icon: typeof faPassport; // or more precisely, IconDefinition
  currentValue: DocumentType;
  onChange: () => void;
}

const DocRadioButton = memo(function DocRadioButton({
  label,
  value,
  icon,
  currentValue,
  onChange,
}: DocRadioButtonProps) {
  const isActive = currentValue === value;
  return (
    <label
      className={`flex items-center gap-2 border rounded p-2 hover:bg-gray-100 dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen ${
        isActive ? "bg-gray-200 dark:bg-darkSurface" : ""
      }`}
    >
      <input
        type="radio"
        name="docType"
        value={value}
        checked={isActive}
        onChange={onChange}
        className="sr-only"
      />
      <FontAwesomeIcon icon={icon} />
      {label}
    </label>
  );
});
