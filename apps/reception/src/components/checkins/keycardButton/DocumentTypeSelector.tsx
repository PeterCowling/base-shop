/* File: /src/components/checkins/KeycardButton/DocumentTypeSelector.tsx */
import React, { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Contact, IdCard } from "lucide-react";

import { Input } from "@acme/design-system";

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
    <fieldset className="mt-2">
      <legend className="block mb-1 font-semibold">Document Type:</legend>
      <div className="flex flex-col gap-2">
        <DocRadioButton
          label="Passport"
          value={DocumentType.PASSPORT}
          icon={BookOpen}
          currentValue={docType}
          onChange={() => setDocType(DocumentType.PASSPORT)}
        />

        <DocRadioButton
          label="Driver License"
          value={DocumentType.DRIVING_LICENSE}
          icon={Contact}
          currentValue={docType}
          onChange={() => setDocType(DocumentType.DRIVING_LICENSE)}
        />

        <DocRadioButton
          label="National ID"
          value={DocumentType.ID_CARD}
          icon={IdCard}
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
  icon: LucideIcon;
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
      className={`flex items-center gap-2 border rounded-lg p-2 hover:bg-surface-2 ${
        isActive ? "bg-surface-3" : ""
      }`}
    >
      <Input compatibilityMode="no-wrapper"
        type="radio"
        name="docType"
        value={value}
        checked={isActive}
        onChange={onChange}
        className="sr-only"
      />
      {React.createElement(icon, { size: 16 })}
      {label}
    </label>
  );
});
