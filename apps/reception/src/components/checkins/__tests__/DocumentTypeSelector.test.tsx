/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import DocumentTypeSelector from "../keycardButton/DocumentTypeSelector";
import { DocumentType } from "../../../types/keycards";

function Wrapper() {
  const [docType, setDocType] = useState<DocumentType>(DocumentType.PASSPORT);
  return <DocumentTypeSelector docType={docType} setDocType={setDocType} />;
}

describe("DocumentTypeSelector", () => {
  it("allows selecting a different document type", async () => {
    render(<Wrapper />);
    const licenseRadio = screen.getByLabelText(/Driver License/i);
    await userEvent.click(licenseRadio);
    expect(licenseRadio).toBeChecked();
  });
});
