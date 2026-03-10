/* File: /src/components/checkins/KeycardButton/DocumentTypeSelector.tsx */
import React, { memo } from "react";
import { BookOpen, Contact, IdCard } from "lucide-react";

import { DocumentType } from "../../../types/keycards";
import { RadioOption } from "../../common/RadioOption";

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
        <RadioOption<DocumentType>
          label="Passport"
          value={DocumentType.PASSPORT}
          icon={BookOpen}
          name="docType"
          currentValue={docType}
          onChange={() => setDocType(DocumentType.PASSPORT)}
        />

        <RadioOption<DocumentType>
          label="Driver License"
          value={DocumentType.DRIVING_LICENSE}
          icon={Contact}
          name="docType"
          currentValue={docType}
          onChange={() => setDocType(DocumentType.DRIVING_LICENSE)}
        />

        <RadioOption<DocumentType>
          label="National ID"
          value={DocumentType.ID_CARD}
          icon={IdCard}
          name="docType"
          currentValue={docType}
          onChange={() => setDocType(DocumentType.ID_CARD)}
        />
      </div>
    </fieldset>
  );
}

export default memo(DocumentTypeSelector);
