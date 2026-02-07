/* File: /src/components/man/Alloggiati.tsx */
import { type FC, memo, useEffect, useMemo, useState } from "react";

import useActivitiesByCodeData from "../../hooks/data/useActivitiesByCodeData";
import useAlloggiatiLogs from "../../hooks/data/useAlloggiatiLogs";
import { useCheckins } from "../../hooks/data/useCheckins";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import { useAlloggiatiSender } from "../../hooks/mutations/useAlloggiatiSender";
import useSaveAlloggiatiResult from "../../hooks/mutations/useSaveAlloggiatiResult";
import { type OccupantDetails } from "../../types/hooks/data/guestDetailsData";
import {
  formatDate,
  getItalyIsoString,
  parseLocalDate,
  subDays,
} from "../../utils/dateUtils";
import { type AlloggiatiResultDetail } from "../../utils/parseAlloggiatiResponse";
import { showToast } from "../../utils/toastUtils";

import DateSelectorCI from "./DateSelectorAllo";

interface OccupantData {
  reservationCode: string;
  timestamp: string;
}

/**
 * An augmented occupant entry for table display and submission.
 */
interface OccupantEntry {
  occupantId: string;
  reservationCode: string;
  hasCode12: boolean;
  occupantDetail?: OccupantDetails;
}

const AlloggiatiComponent: FC = () => {
  // ----------- Local State -----------
  // Default to YESTERDAY in Italy, in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const italyIso = getItalyIsoString();
    const dt = subDays(
      parseLocalDate(italyIso.slice(0, 10)) || new Date(italyIso),
      1,
    );
    return formatDate(dt);
  });

  // ----------- Data Hooks -----------
  const {
    checkins,
    loading: checkinsLoading,
    error: checkinsError,
  } = useCheckins({ startAt: selectedDate, endAt: selectedDate });
  const {
    activitiesByCodes,
    loading: act12Loading,
    error: act12Error,
  } = useActivitiesByCodeData({ codes: [12] });
  const {
    guestsDetails,
    loading: guestsLoading,
    error: guestsError,
    validationError: _guestValErr,
  } = useGuestDetails();

  // Track occupant selection states (checkboxes)
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

  // **Test mode default is now false**:
  const [testMode, setTestMode] = useState<boolean>(false);

  // Storing final submission results (success or error details)
  const [submissionResults, setSubmissionResults] = useState<
    AlloggiatiResultDetail[] | null
  >(null);

  // ----------- Alloggiati Logs Hook -----------
  const {
    logs: alloggiatiLogs,
    loading: alloggiatiLogsLoading,
    error: alloggiatiLogsError,
  } = useAlloggiatiLogs(selectedDate);

  // Combine all loading/error states
  const isLoading =
    checkinsLoading || act12Loading || guestsLoading || alloggiatiLogsLoading;
  const combinedError =
    checkinsError || act12Error || guestsError || alloggiatiLogsError;

  // ----------- Build occupant entries -----------
  const occupantEntries = useMemo<OccupantEntry[]>(() => {
    if (!checkins || !selectedDate) return [];
    const checkinsForDate = checkins[selectedDate];
    if (!checkinsForDate) return [];

    const code12Data = activitiesByCodes["12"] ?? {};

    return Object.entries(checkinsForDate).map(([occupantId, data]) => {
      const occupantCheckin = data as OccupantData;
      const reservationCode = occupantCheckin.reservationCode || "";

      // Occupant personal details
      let occupantDetail: OccupantDetails | undefined;
      if (
        guestsDetails[reservationCode] &&
        guestsDetails[reservationCode][occupantId]
      ) {
        occupantDetail = guestsDetails[reservationCode][occupantId];
      }

      return {
        occupantId,
        reservationCode,
        hasCode12: Boolean(code12Data[occupantId]),
        occupantDetail,
      };
    });
  }, [checkins, selectedDate, activitiesByCodes, guestsDetails]);

  // Whenever occupantEntries changes, default-check all
  useEffect(() => {
    if (!occupantEntries.length) {
      setSelectedMap({});
      return;
    }
    const initSelected: Record<string, boolean> = {};
    occupantEntries.forEach((entry) => {
      initSelected[entry.occupantId] = true;
    });
    setSelectedMap(initSelected);
  }, [occupantEntries]);

  // Single occupant's checkbox toggle
  function handleCheckboxChange(occupantId: string) {
    setSelectedMap((prev) => ({
      ...prev,
      [occupantId]: !prev[occupantId],
    }));
  }

  // Toggle all occupant's checkboxes
  function handleToggleAll() {
    const allSelected = occupantEntries.every((e) => {
      const logEntry = alloggiatiLogs?.[e.occupantId];
      // If occupant is "ok", there's no checkbox, so skip it from the "allSelected" logic
      if (logEntry && logEntry.result === "ok") {
        return true;
      }
      return !!selectedMap[e.occupantId];
    });

    const newMap: Record<string, boolean> = {};
    occupantEntries.forEach((e) => {
      const logEntry = alloggiatiLogs?.[e.occupantId];
      // If occupant is "ok", we do not include a checkbox
      if (logEntry?.result === "ok") {
        return; // do not modify
      }
      newMap[e.occupantId] = !allSelected;
    });
    setSelectedMap(newMap);
  }

  // ----------- Using the Alloggiati Sender Hook -----------
  const {
    isLoading: isSendLoading,
    error: sendError,
    sendAlloggiatiRecords,
  } = useAlloggiatiSender();

  // Also use "saveAlloggiatiResult" hook
  const { saveAlloggiatiResult, error: saveError } = useSaveAlloggiatiResult();

  /**
   * Builds an array of occupant objects that are selected (checkbox)
   * AND have occupantDetail. Then calls "sendAlloggiatiRecords" with
   * those occupant details. Finally, logs the result to Firebase for
   * both success ("ok") and error states.
   */
  async function handleSendAlloggiati() {
    setSubmissionResults(null); // clear old results
    try {
      // Filter occupant entries that are selected & have occupantDetail
      // Also skip those occupant entries already "ok" in logs (no checkbox).
      const occupantDataToSend = occupantEntries
        .filter((entry) => {
          const logEntry = alloggiatiLogs?.[entry.occupantId];
          const notAlreadyOk = !logEntry || logEntry.result !== "ok";
          return (
            selectedMap[entry.occupantId] &&
            entry.occupantDetail &&
            notAlreadyOk
          );
        })
        .map((entry) => ({
          occupantId: entry.occupantId,
          occupantDetail: entry.occupantDetail as OccupantDetails,
        }));

      if (occupantDataToSend.length === 0) {
        showToast("No occupant details available to send.", "warning");
        return;
      }

      // 1) Send occupant data to Google Apps Script → Alloggiati
      const results = await sendAlloggiatiRecords(
        occupantDataToSend.map((o) => o.occupantDetail),
        testMode
      );

      if (results) {
        setSubmissionResults(results);

        // 2) For each occupant, determine success or error
        for (let i = 0; i < occupantDataToSend.length; i++) {
          const occupant = occupantDataToSend[i];
          const resultDetail = results[i];
          const occupantId = occupant.occupantId;
          const nowItalyIso = getItalyIsoString();

          if (resultDetail && resultDetail.status === "ok") {
            // Store success
            await saveAlloggiatiResult(
              selectedDate,
              occupantId,
              "ok",
              nowItalyIso
            );
          } else if (resultDetail) {
            // Store error details
            await saveAlloggiatiResult(
              selectedDate,
              occupantId,
              "error",
              nowItalyIso,
              {
                erroreCod: resultDetail.erroreCod,
                erroreDes: resultDetail.erroreDes,
                erroreDettaglio: resultDetail.erroreDettaglio,
                occupantRecord: resultDetail.occupantRecord,
                occupantRecordLength: resultDetail.occupantRecordLength,
              }
            );
          }
        }
      }
    } catch (err) {
      console.error("Failed to send to Alloggiati:", err);
    }
  }

  // ----------- Rendering -----------
  return (
    <>
      <h2 className="text-xl font-bold">Alloggiati</h2>

      <DateSelectorCI
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        testMode={testMode}
        onTestModeChange={setTestMode}
      />

      {isLoading && (
        <p className="mt-4">
          Loading checkins, financial data, guest details, or occupant logs...
        </p>
      )}
      {combinedError && (
        <p className="mt-4 text-red-500">Error: {String(combinedError)}</p>
      )}

      {!isLoading && occupantEntries.length === 0 && (
        <p className="mt-4 italic">No occupants found for {selectedDate}.</p>
      )}

      {occupantEntries.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="table-auto w-full border border-gray-400 text-sm dark:border-darkSurface">
            <thead className="bg-gray-100 border-b border-gray-400 dark:border-darkSurface dark:bg-darkSurface">
              <tr>
                <th className="py-2 px-3 text-start">Occupant ID</th>
                <th className="py-2 px-3 text-start">Reservation Code</th>
                <th className="py-2 px-3 text-start">NAME</th>
                <th className="py-2 px-3 text-center">
                  <button
                    onClick={handleToggleAll}
                    className="px-3 py-2 text-sm border rounded"
                  >
                    Select / Deselect All
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {occupantEntries.map((entry) => {
                const occupantId = entry.occupantId;
                const occupantLog = alloggiatiLogs?.[occupantId];

                // Determine row styles based on occupantLog status
                let rowClass = "border-b border-gray-400 dark:border-darkSurface";
                let showCheckbox = true;

                if (occupantLog?.result === "ok") {
                  // If occupant was previously successful -> green row, no checkbox
                  rowClass += " bg-green-100 dark:bg-darkSurface";
                  showCheckbox = false;
                } else if (occupantLog?.result === "error") {
                  // Occupant had an error -> red row, still can re-submit
                  rowClass += " bg-red-100 dark:bg-darkSurface";
                  showCheckbox = true;
                } else {
                  // No log: normal row, checkbox
                  rowClass += " bg-white dark:bg-darkSurface";
                  showCheckbox = true;
                }

                const occupantName = entry.occupantDetail
                  ? `${entry.occupantDetail.firstName ?? ""} ${
                      entry.occupantDetail.lastName ?? ""
                    }`.trim()
                  : "";

                return (
                  <tr key={occupantId} className={rowClass}>
                    <td className="py-2 px-3">{occupantId}</td>
                    <td className="py-2 px-3">{entry.reservationCode}</td>
                    <td className="py-2 px-3">{occupantName}</td>
                    <td className="py-2 px-3 text-center">
                      {showCheckbox ? (
                        <input
                          type="checkbox"
                          className="h-6 w-6"
                          checked={!!selectedMap[occupantId]}
                          onChange={() => handleCheckboxChange(occupantId)}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Send Section */}
      <div className="mt-6 p-3 border border-gray-400 rounded dark:border-darkSurface">
        <h3 className="font-semibold mb-2">Send to Alloggiati Web Service</h3>

        <button
          onClick={handleSendAlloggiati}
          className="px-3 py-2 bg-blue-600 text-white rounded"
          disabled={isLoading || isSendLoading}
        >
          {isSendLoading ? "Sending..." : "Send Occupants"}
        </button>

        {sendError && (
          <p className="mt-2 text-red-600">Error Sending: {sendError}</p>
        )}
        {saveError ? (
          <p className="mt-2 text-red-600">
            Error Saving to Firebase: {String(saveError)}
          </p>
        ) : null}
        {submissionResults && (
          <div className="mt-2 p-2 border border-green-400 bg-green-50 text-sm">
            <p className="font-bold">
              Submission Results ({testMode ? "TEST" : "LIVE"}):
            </p>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(submissionResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(AlloggiatiComponent);
