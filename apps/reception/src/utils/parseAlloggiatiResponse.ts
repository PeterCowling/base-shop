/* File: /src/utils/parseAlloggiatiResponse.ts
   Comment: Parsing SOAP XML returned from the Alloggiati web service in test/live calls. */
import type { z } from "zod";

import { alloggiatiResultDetailSchema } from "./alloggiatiResultSchema";

export type AlloggiatiResultDetail = z.infer<
  typeof alloggiatiResultDetailSchema
>;

function parseAlloggiatiXmlResponse(
  xml: string,
  responseTagName: string
): AlloggiatiResultDetail[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const body = doc.getElementsByTagName("soap:Body")[0];
  if (!body) return [];

  const responseEl = body.getElementsByTagName(responseTagName)[0];
  if (!responseEl) return [];

  const result = responseEl.getElementsByTagName("result")[0];
  if (!result) return [];

  const dettaglio = result.getElementsByTagName("Dettaglio")[0];
  if (!dettaglio) return [];

  const esitoNodes = dettaglio.getElementsByTagName("EsitoOperazioneServizio");
  const finalResults: AlloggiatiResultDetail[] = [];
  for (let i = 0; i < esitoNodes.length; i++) {
    const esitoElement = esitoNodes[i];
    const esitoText =
      esitoElement.getElementsByTagName("esito")[0]?.textContent;
    const isOk = esitoText === "true";
    let detail: AlloggiatiResultDetail;

    if (isOk) {
      detail = {
        recordNumber: String(i + 1),
        status: "ok",
      };
    } else {
      detail = {
        recordNumber: String(i + 1),
        esito: false,
        erroreCod:
          esitoElement.getElementsByTagName("ErroreCod")[0]?.textContent || "",
        erroreDes:
          esitoElement.getElementsByTagName("ErroreDes")[0]?.textContent || "",
        erroreDettaglio:
          esitoElement.getElementsByTagName("ErroreDettaglio")[0]
            ?.textContent || "",
      };
    }
    alloggiatiResultDetailSchema.safeParse(detail);
    finalResults.push(detail);
  }
  return finalResults;
}

/**
 * Looks for `<TestResponse> -> <result> -> <Dettaglio> -> <EsitoOperazioneServizio>` array
 */
export function parseTestResponse(xml: string): AlloggiatiResultDetail[] {
  return parseAlloggiatiXmlResponse(xml, "TestResponse");
}

/**
 * Looks for `<SendResponse> -> <result> -> <Dettaglio> -> <EsitoOperazioneServizio>` array
 */
export function parseLiveResponse(xml: string): AlloggiatiResultDetail[] {
  return parseAlloggiatiXmlResponse(xml, "SendResponse");
}
