import { describe, expect, test } from "vitest";

import { alloggiatiResultDetailSchema } from "../alloggiatiResultSchema";
import {
  parseLiveResponse,
  parseTestResponse,
} from "../parseAlloggiatiResponse";

describe("parseAlloggiatiResponse", () => {
  test("parseTestResponse returns success and error details", () => {
    const xml = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <TestResponse>
            <result>
              <Dettaglio>
                <EsitoOperazioneServizio>
                  <esito>true</esito>
                </EsitoOperazioneServizio>
                <EsitoOperazioneServizio>
                  <esito>false</esito>
                  <ErroreCod>11</ErroreCod>
                  <ErroreDes>FORMAT_ERROR</ErroreDes>
                  <ErroreDettaglio>Row dimension wrong</ErroreDettaglio>
                </EsitoOperazioneServizio>
              </Dettaglio>
            </result>
          </TestResponse>
        </soap:Body>
      </soap:Envelope>`;

    const result = parseTestResponse(xml);
    expect(result).toEqual([
      { recordNumber: "1", status: "ok" },
      {
        recordNumber: "2",
        esito: false,
        erroreCod: "11",
        erroreDes: "FORMAT_ERROR",
        erroreDettaglio: "Row dimension wrong",
      },
    ]);

    result.forEach((r) => {
      const validation = alloggiatiResultDetailSchema.safeParse(r);
      expect(validation.success).toBe(true);
    });
  });

  test("parseLiveResponse returns success and error details", () => {
    const xml = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <SendResponse>
            <result>
              <Dettaglio>
                <EsitoOperazioneServizio>
                  <esito>true</esito>
                </EsitoOperazioneServizio>
                <EsitoOperazioneServizio>
                  <esito>false</esito>
                  <ErroreCod>22</ErroreCod>
                  <ErroreDes>OTHER_ERROR</ErroreDes>
                  <ErroreDettaglio>Some detail</ErroreDettaglio>
                </EsitoOperazioneServizio>
              </Dettaglio>
            </result>
          </SendResponse>
        </soap:Body>
      </soap:Envelope>`;

    const result = parseLiveResponse(xml);
    expect(result).toEqual([
      { recordNumber: "1", status: "ok" },
      {
        recordNumber: "2",
        esito: false,
        erroreCod: "22",
        erroreDes: "OTHER_ERROR",
        erroreDettaglio: "Some detail",
      },
    ]);

    result.forEach((r) => {
      const validation = alloggiatiResultDetailSchema.safeParse(r);
      expect(validation.success).toBe(true);
    });
  });

  test("invalid XML fails validation", () => {
    const xml = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <TestResponse>
            <result>
              <Dettaglio>
                <EsitoOperazioneServizio>
                  <esito>false</esito>
                  <ErroreDes>BAD</ErroreDes>
                </EsitoOperazioneServizio>
              </Dettaglio>
            </result>
          </TestResponse>
        </soap:Body>
      </soap:Envelope>`;

    const result = parseTestResponse(xml);
    expect(result).toHaveLength(1);
    const validation = alloggiatiResultDetailSchema.safeParse(result[0]);
    expect(validation.success).toBe(false);
  });

  test("missing TestResponse returns empty arrays", () => {
    const xml = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <SomeOtherTag />
        </soap:Body>
      </soap:Envelope>`;
    expect(parseTestResponse(xml)).toEqual([]);
    expect(parseLiveResponse(xml)).toEqual([]);
  });

  test("missing result returns empty arrays", () => {
    const xml = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <TestResponse />
        </soap:Body>
      </soap:Envelope>`;
    expect(parseTestResponse(xml)).toEqual([]);
    expect(parseLiveResponse(xml)).toEqual([]);
  });

  test("missing Dettaglio returns empty arrays", () => {
    const xml = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <TestResponse>
            <result />
          </TestResponse>
        </soap:Body>
      </soap:Envelope>`;
    expect(parseTestResponse(xml)).toEqual([]);
    expect(parseLiveResponse(xml)).toEqual([]);
  });
});
