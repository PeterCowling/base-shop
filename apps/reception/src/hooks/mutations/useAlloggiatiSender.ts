/* File: /src/hooks/mutations/useAlloggiatiSender.ts
   Comment: Client mutator hook to send occupant data to Alloggiati via Google Apps Script.
            We have removed username/password/wsKey references from the client entirely.
*/

import { useCallback, useState } from "react";

import { sendAlloggiatiRecordsToGoogleScript } from "../../services/alloggiatiService";
import { type OccupantDetails } from "../../types/hooks/data/guestDetailsData";
import { type AlloggiatiResultDetail } from "../../utils/parseAlloggiatiResponse";
import { useConstructAlloggiatiRecord } from "../utils/useConstructAlloggiatiRecord";

interface UseAlloggiatiSenderResult {
  isLoading: boolean;
  error: string | null;
  sendAlloggiatiRecords: (
    occupants: OccupantDetails[],
    testMode: boolean
  ) => Promise<AlloggiatiResultDetail[] | null>;
}

/**
 * Hook to handle occupant record generation and sending
 * them to the Google Apps Script (which calls Alloggiati).
 * No credentials are passed from the client.
 */
export function useAlloggiatiSender(): UseAlloggiatiSenderResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ADDED: Call the hook to get the construction function
  const { constructAlloggiatiRecord } = useConstructAlloggiatiRecord();

  const sendAlloggiatiRecords = useCallback(
    async (
      occupants: OccupantDetails[],
      testMode: boolean
    ): Promise<AlloggiatiResultDetail[] | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Construct occupant record strings using the function obtained from the hook
        const occupantRecords = occupants.map(
          (occ) => constructAlloggiatiRecord(occ) // Now this function is correctly obtained
        );

        // Send to Google Apps Script (SOAP behind the scenes)
        const results = await sendAlloggiatiRecordsToGoogleScript(
          occupantRecords,
          testMode
        );

        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error("[useAlloggiatiSender]", message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [constructAlloggiatiRecord] // ADDED: Dependency on the function obtained from the hook
  );

  return {
    isLoading,
    error,
    sendAlloggiatiRecords,
  };
}
