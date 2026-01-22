/* File: /src/services/alloggiatiService.ts
   Comment: Sends occupant records to the Google Apps Script endpoint using JSONP 
            and *includes occupantRecord/occupantRecordLength in the final array*.
*/

import { z } from "zod";

import { type AlloggiatiResultDetail } from "../utils/parseAlloggiatiResponse";

const GASResponseItemSchema = z.object({
  recordNumber: z.string(),
  status: z.string().optional(),
  esito: z.boolean().optional(),
  erroreCod: z.string().optional(),
  erroreDes: z.string().optional(),
  erroreDettaglio: z.string().optional(),
  occupantRecord: z.string().optional(),
  occupantRecordLength: z.number().optional(),
});

export type GASResponseItem = z.infer<typeof GASResponseItemSchema>;

const GASResponseSuccessSchema = z.object({
  resultDetails: z.array(GASResponseItemSchema),
});

const GASResponseErrorSchema = z.object({
  error: z.literal(true),
  message: z.string(),
});

const GASResponseSchema = z.union([
  GASResponseSuccessSchema,
  GASResponseErrorSchema,
]);
export type GASResponse = z.infer<typeof GASResponseSchema>;

/**
 * JSONP function to call the Google Apps Script web app.
 * The server now includes occupantRecord & occupantRecordLength
 * for any error results. We'll keep them in the final output.
 */
export function sendAlloggiatiRecordsToGoogleScript(
  occupantRecords: string[],
  testMode: boolean
): Promise<AlloggiatiResultDetail[]> {
  const googleScriptUrl =
    "https://script.google.com/macros/s/AKfycbxemYj6vv2k8qDyF3QieAfCujnlUeHMMKriYV8lkhLiHVvb7FnjTpwRTtF-Uo9-VT9UVQ/exec";

  return new Promise((resolve, reject) => {
    const occupantRecordParam = occupantRecords.join("||");
    const callbackName = `jsonpCallback_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}`;

    // Attach a callback on the window
    (window as unknown as Record<string, (data: unknown) => void>)[
      callbackName
    ] = (rawData: unknown) => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      const parsed = GASResponseSchema.safeParse(rawData);
      if (!parsed.success) {
        reject(new Error(`Invalid response format: ${parsed.error.message}`));
        return;
      }

      const response: GASResponse = parsed.data;

      if ("error" in response && response.error) {
        reject(new Error(response.message));
      } else if ("resultDetails" in response) {
        // IMPORTANT: copy occupantRecord & occupantRecordLength
        const resultDetails: GASResponseItem[] = response.resultDetails.map(
          (item: GASResponseItem) => {
            if (item.status === "ok") {
              return {
                recordNumber: item.recordNumber,
                status: "ok",
              };
            }
            return {
              recordNumber: item.recordNumber,
              status: "error",
              erroreCod: item.erroreCod || "",
              erroreDes: item.erroreDes || "",
              erroreDettaglio: item.erroreDettaglio || "",
              occupantRecord: item.occupantRecord || "",
              occupantRecordLength: item.occupantRecordLength || 0,
            };
          }
        );

        // Now cast that array to AlloggiatiResultDetail for the rest of the app
        const typedResults: AlloggiatiResultDetail[] = resultDetails.map(
          (r: GASResponseItem) => ({
            recordNumber: r.recordNumber,
            status: r.status,
            erroreCod: r.erroreCod,
            erroreDes: r.erroreDes,
            erroreDettaglio: r.erroreDettaglio,
            occupantRecord: r.occupantRecord,
            occupantRecordLength: r.occupantRecordLength,
          })
        );

        resolve(typedResults);
      } else {
        reject(new Error("Invalid response format: missing resultDetails"));
      }
    };

    // Build query string
    const params = new URLSearchParams({
      occupantRecord: occupantRecordParam,
      testMode: testMode ? "true" : "false",
      callback: callbackName,
    });

    // Create script element for JSONP
    const script = document.createElement("script");
    script.src = `${googleScriptUrl}?${params.toString()}`;

    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(new Error("Network error loading JSONP script."));
    };

    document.body.appendChild(script);
  });
}
