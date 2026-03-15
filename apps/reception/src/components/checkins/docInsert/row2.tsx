import React, {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Inline } from "@acme/design-system/primitives";

import { type OccupantDetails } from "../../../types/hooks/data/guestDetailsData";
import { showToast } from "../../../utils/toastUtils";

import AutoComplete from "./AutoComplete";
import { useDocInsertData } from "./useDocInsertData";

const ROW2_INPUT_BASE = "border border-info-light rounded-lg px-3 py-2 w-300px focus:outline-none focus:ring-1 focus:ring-primary-main";

interface Row2Props {
  occupantDetails: OccupantDetails;
  saveField: (fieldName: string, value: unknown) => Promise<void>;
}

/**
 * Limited set of occupantDetails fields we are editing here.
 */
type Row2FieldName = "placeOfBirth" | "citizenship" | "municipality";

/**
 * Row2: Place Of Birth, Citizenship, Municipality
 *
 * Behavior:
 * 1. If user selects an AutoComplete suggestion, submit immediately.
 * 2. If user manually types a value, pressing Enter or blurring the field
 *    triggers validation (placeOfBirth/citizenship must match countries;
 *    municipality is freeform) and submission.
 * 3. Whenever a value is saved successfully, the corresponding input's
 *    background turns green.
 * 4. If the user modifies the field again, the green highlight goes away
 *    until the new value is successfully saved.
 */
function Row2({ occupantDetails, saveField }: Row2Props): JSX.Element {
  const { countries, municipalities } = useDocInsertData();

  // Local text states
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [municipality, setMunicipality] = useState("");

  // "Saved" states to mark each field as green once saved
  const [savedFields, setSavedFields] = useState<Record<Row2FieldName, boolean>>({
    placeOfBirth: false,
    citizenship: false,
    municipality: false,
  });

  /**
   * Initialize from occupantDetails.
   * If occupantDetails already has values, mark them as saved.
   */
  useEffect(() => {
    const {
      placeOfBirth = "",
      citizenship = "",
      municipality = "",
    } = occupantDetails || {};

    setPlaceOfBirth(placeOfBirth);
    setCitizenship(citizenship);
    setMunicipality(municipality);
    setSavedFields({
      placeOfBirth: !!placeOfBirth.trim(),
      citizenship: !!citizenship.trim(),
      municipality: !!municipality.trim(),
    });
  }, [occupantDetails]);

  /**
   * Save a field's value to the backend using promise-based .then/.catch,
   * in line with the "no try/catch" requirement.
   */
  const commitField = useCallback(
    (fieldName: Row2FieldName, newValue: string): void => {
      const trimmedValue = newValue.trim();
      // If the occupantDetails already has the exact same value, do nothing
      const oldValue = (occupantDetails[fieldName] || "").trim();
      if (oldValue === trimmedValue) return;

      saveField(fieldName, trimmedValue)
        .then(() => {
          showToast(`${fieldName} updated successfully!`, "success");
          setSavedFields((prev) => ({ ...prev, [fieldName]: true }));
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            showToast(`Failed to update ${fieldName}: ${err.message}`, "error");
          } else {
            showToast(
              `Failed to update ${fieldName} due to an unknown error.`,
              "error"
            );
          }
        });
    },
    [occupantDetails, saveField]
  );

  /**
   * Returns true if 'value' is in the 'countries' list, ignoring case.
   */
  const isValidCountry = useCallback((value: string) => {
    const lower = value.trim().toLowerCase();
    return countries.some((c) => c.toLowerCase() === lower);
  }, [countries]);

  // Mark fields as "unsaved" when the user changes them
  const handlePlaceOfBirthChange = useCallback((val: string) => {
    setPlaceOfBirth(val);
    setSavedFields((prev) => ({ ...prev, placeOfBirth: false }));
  }, []);

  const handleCitizenshipChange = useCallback((val: string) => {
    setCitizenship(val);
    setSavedFields((prev) => ({ ...prev, citizenship: false }));
  }, []);

  const handleMunicipalityChange = useCallback((val: string) => {
    setMunicipality(val);
    setSavedFields((prev) => ({ ...prev, municipality: false }));
  }, []);

  /**
   * Validate & commit placeOfBirth.
   */
  const finalizePlaceOfBirth = useCallback(
    (value: string) => {
      const trimmedVal = value.trim();
      if (!trimmedVal) {
        setPlaceOfBirth("");
        return;
      }
      if (!isValidCountry(trimmedVal)) {
        showToast("This is not a valid value.", "error");
        setPlaceOfBirth("");
        return;
      }
      setPlaceOfBirth(trimmedVal);
      commitField("placeOfBirth", trimmedVal);
    },
    [commitField, isValidCountry]
  );

  /**
   * Validate & commit citizenship.
   */
  const finalizeCitizenship = useCallback(
    (value: string) => {
      const trimmedVal = value.trim();
      if (!trimmedVal) {
        setCitizenship("");
        return;
      }
      if (!isValidCountry(trimmedVal)) {
        showToast("This is not a valid value.", "error");
        setCitizenship("");
        return;
      }
      setCitizenship(trimmedVal);
      commitField("citizenship", trimmedVal);
    },
    [commitField, isValidCountry]
  );

  /**
   * Municipality has no strict validation.
   */
  const finalizeMunicipality = useCallback(
    (value: string) => {
      setMunicipality(value);
      commitField("municipality", value);
    },
    [commitField]
  );

  /**
   * Keydown handler to finalize input on Enter key.
   */
  const handleKeyDown =
    (value: string, finalizeFn: (val: string) => void) =>
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        finalizeFn(value);
      }
    };

  /**
   * We only want to finalize on blur if the user truly leaves the field
   * (i.e., not clicking an autocomplete suggestion). We'll check if
   * e.relatedTarget has data-suggestion-button="true" to skip.
   */
  const handleFieldBlur = useCallback(
    (
      e: FocusEvent<HTMLInputElement>,
      currentValue: string,
      finalizeFn: (val: string) => void
    ) => {
      if (
        e.relatedTarget &&
        e.relatedTarget.getAttribute("data-suggestion-button") === "true"
      ) {
        // User clicked a suggestion — that path calls finalize separately
        return;
      }
      finalizeFn(currentValue);
    },
    []
  );

  return (
    <Inline gap={12} className="mb-75px">
      {/* Place of Birth */}
      <div className="flex flex-col w-300px">
        <AutoComplete
          id="placeOfBirth"
          label="Place of Birth"
          value={placeOfBirth}
          onChange={handlePlaceOfBirthChange}
          onItemSelect={finalizePlaceOfBirth}
          onBlur={(e) => handleFieldBlur(e, placeOfBirth, finalizePlaceOfBirth)}
          onKeyDown={handleKeyDown(placeOfBirth, finalizePlaceOfBirth)}
          suggestions={countries}
          placeholder="Enter place of birth"
          inputClassName={`${ROW2_INPUT_BASE} ${savedFields.placeOfBirth ? "bg-success-light/50" : ""}`}
        />
      </div>

      {/* Citizenship */}
      <div className="flex flex-col w-300px">
        <AutoComplete
          id="citizenship"
          label="Citizenship"
          value={citizenship}
          onChange={handleCitizenshipChange}
          onItemSelect={finalizeCitizenship}
          onBlur={(e) => handleFieldBlur(e, citizenship, finalizeCitizenship)}
          onKeyDown={handleKeyDown(citizenship, finalizeCitizenship)}
          suggestions={countries}
          placeholder="Enter citizenship"
          inputClassName={`${ROW2_INPUT_BASE} ${savedFields.citizenship ? "bg-success-light/50" : ""}`}
        />
      </div>

      {/* Municipality */}
      <div className="flex flex-col w-300px">
        <label
          htmlFor="municipality"
          className="block mb-1 font-semibold text-info-dark"
        >
          Municipality
        </label>
        <AutoComplete
          id="municipality"
          label=""
          value={municipality}
          onChange={handleMunicipalityChange}
          onItemSelect={finalizeMunicipality}
          onBlur={(e) => handleFieldBlur(e, municipality, finalizeMunicipality)}
          onKeyDown={handleKeyDown(municipality, finalizeMunicipality)}
          suggestions={municipalities}
          placeholder="Enter municipality"
          inputClassName={`${ROW2_INPUT_BASE} ${savedFields.municipality ? "bg-success-light/50" : ""}`}
        />
      </div>
    </Inline>
  );
}

export default React.memo(Row2);
