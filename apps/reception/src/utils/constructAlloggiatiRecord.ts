/* File: /src/hooks/utils/useConstructAlloggiatiRecord.tsx
   Comment: Data Orchestrator Hook to replicate last year's approach for building
            Alloggiati records. It combines occupant data with local comune lookups
            (via useComuneCodes) and country codes (via getCountryCode). This
            ensures we no longer rely on a Google Sheet for comune codes.
            Avoid altering the structure in ways that break consuming code.
*/

import { useCallback } from "react";

import { getCountryCode } from "./getCountryCode";
import { useComuneCodes } from "./useComuneCodes";
import { formatDdMmYyyy, getYesterday } from "./dateUtils";
import { OccupantDetails } from "../types/hooks/data/guestDetailsData";

/**
 * Exposes a function "constructAlloggiatiRecord(occupant)" that
 * replicates last year's logic for building a single occupant record string.
 * We now retrieve comune codes & provinces using `useComuneCodes`.
 */
export function useConstructAlloggiatiRecord() {
  const { getComuneInfo } = useComuneCodes();

  /**
   * Builds a single record string suitable for Alloggiati's test/live upload.
   * Pulls in comune code and province using the occupant's .municipality field
   * only if placeOfBirth is 'Italy'. Otherwise, both comuneCode and province
   * default to 'Unknown'.
   */
  const constructAlloggiatiRecord = useCallback(
    (occupant: OccupantDetails): string => {
      // “16” = single occupant code
      const OSPITE_SINGOLO = "16";

      // For demonstration: arrival date = "yesterday" in dd/mm/yyyy
      const arrivalDate = formatDdMmYyyy(getYesterday());

      // Hard-code nights=1 for demonstration (similar to last year's approach)
      const nights = "1";

      // Field widths per Alloggiati specification
      const recordConfig = {
        nightsLength: 2, // positions 12–13
        surnameLength: 50, // positions 14–63
        firstNameLength: 30, // positions 64–93
        dobLength: 10, // positions 95–104
        comuniCodeLength: 9, // positions 105–113
        provCodeLength: 2, // positions 114–115
        pobLength: 9, // positions 116–124
        citzLength: 9, // positions 125–133
        docTypeLength: 5, // positions 134–138
        docNumLength: 20, // positions 139–158
        docCounLength: 9, // positions 159–167
      };

      /**
       * Utility to avoid overshooting fixed-length fields.
       * If value is longer than length, it is truncated; else it is padded with spaces.
       */
      function safePad(value: string, length: number): string {
        const trimmed = value.substring(0, length);
        return trimmed.padEnd(length, " ");
      }

      /**
       * Maps occupant's raw doc type to the Alloggiati 5-char code.
       */
      function getDocumentCode(rawType?: string): string {
        if (!rawType) return "UNKNW";
        const uppercase = rawType.toUpperCase();
        if (uppercase.includes("PASSPORT")) return "PASOR";
        if (uppercase.includes("ID CARD")) return "IDENT";
        if (uppercase.includes("DRIVERS")) return "PATEN";
        return "UNKNW";
      }

      // occupant.gender => "M" => "1", "F" => "2", else "3"
      let mappedGender = "3";
      if (occupant.gender === "M") mappedGender = "1";
      if (occupant.gender === "F") mappedGender = "2";

      // occupant.dateOfBirth => dd/mm/yyyy
      let dob = "00/00/0000";
      if (occupant.dateOfBirth) {
        const safeDD = occupant.dateOfBirth.dd?.padStart(2, "0") || "00";
        const safeMM = occupant.dateOfBirth.mm?.padStart(2, "0") || "00";
        const safeYYYY = occupant.dateOfBirth.yyyy || "0000";
        dob = `${safeDD}/${safeMM}/${safeYYYY}`;
      }

      // occupant.placeOfBirth => used as "Stato Nascita" in last year's approach
      // we map it through getCountryCode, as originally done
      const placeOfBirthRaw = occupant.placeOfBirth || "Unknown";
      const placeOfBirth = getCountryCode(placeOfBirthRaw);

      // occupant.citizenship => also mapped to the official country code
      const citzRaw = occupant.citizenship || "Unknown";
      const citzCode = getCountryCode(citzRaw);

      // If place of birth is exactly "Italy", we do the comune lookup;
      // otherwise, we default to "Unknown" for both comune code and province.
      let finalComuneCode = "Unknown";
      let finalComuneProvince = "Unknown";

      if (placeOfBirthRaw.trim().toLowerCase() === "italy") {
        // Retrieve [comuneCode, province] via useComuneCodes
        const municipality = occupant.municipality?.trim() || "Unknown";
        const [comuneCode, comuneProvince] = getComuneInfo(municipality);
        finalComuneCode = comuneCode;
        finalComuneProvince = comuneProvince;
      }

      const docType = getDocumentCode(occupant.document?.type);
      const docNum = occupant.document?.number || "";

      const firstName = occupant.firstName || "";
      const lastName = occupant.lastName || "";

      // Build each piece, ensuring each chunk is within the specified width.
      const recordParts = [
        // Tipo Alloggiato (2 chars) => "16"
        safePad(OSPITE_SINGOLO, 2),
        // Data Arrivo (10 chars) => dd/mm/yyyy
        safePad(arrivalDate, 10),
        // Numero Giorni di Permanenza (2 chars)
        safePad(nights, recordConfig.nightsLength),
        // Cognome (50 chars)
        safePad(lastName, recordConfig.surnameLength),
        // Nome (30 chars)
        safePad(firstName, recordConfig.firstNameLength),
        // Sesso (1 char) => '1', '2', or '3'
        mappedGender,
        // Data di Nascita (10 chars) => dd/mm/yyyy
        safePad(dob, recordConfig.dobLength),
        // Comune di nascita (9 chars)
        safePad(finalComuneCode, recordConfig.comuniCodeLength),
        // Provincia di nascita (2 chars)
        safePad(finalComuneProvince, recordConfig.provCodeLength),
        // Stato di nascita (9 chars) => from getCountryCode( occupant.placeOfBirth )
        safePad(placeOfBirth, recordConfig.pobLength),
        // Cittadinanza (9 chars) => from getCountryCode( occupant.citizenship )
        safePad(citzCode, recordConfig.citzLength),
        // Tipo Documento (5 chars)
        safePad(docType, recordConfig.docTypeLength),
        // Numero Documento (20 chars)
        safePad(docNum, recordConfig.docNumLength),
        // Luogo Rilascio Documento (9 chars) => often country code again
        safePad(citzCode, recordConfig.docCounLength),
      ];

      // (Optional) Debug logs to help confirm structure and lengths
      console.log("[constructAlloggiatiRecord] occupant:", occupant);
      recordParts.forEach((part, idx) => {
        console.log(`Index ${idx}, length ${part.length}, value: "${part}"`);
      });

      const finalRecord = recordParts.join("");
      console.log(
        "[constructAlloggiatiRecord] finalRecord length:",
        finalRecord.length
      );
      console.log("[constructAlloggiatiRecord] finalRecord:", finalRecord);

      return finalRecord;
    },
    [getComuneInfo]
  );

  return { constructAlloggiatiRecord };
}
