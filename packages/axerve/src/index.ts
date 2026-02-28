import "server-only";

import type { AxervePaymentParams, AxervePaymentResult } from "./types";

export type { AxervePaymentParams, AxervePaymentResult } from "./types";

const SANDBOX_WSDL =
  "https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL";
const PRODUCTION_WSDL =
  "https://ecomms2s.sella.it/gestpay/gestpayws/WSs2s.asmx?WSDL";

/** Thrown when the Axerve SOAP call fails at the network or protocol level. */
export class AxerveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AxerveError";
  }
}

function parseS2SResult(
  result: unknown,
  fallbackTransactionId: string,
): AxervePaymentResult {
  const r = result as Record<string, Record<string, string>>;
  const txn = r?.callPagamS2SResult;
  return {
    success: txn?.TransactionResult === "OK",
    transactionId: txn?.ShopTransactionID ?? fallbackTransactionId,
    bankTransactionId: txn?.BankTransactionID ?? "",
    authCode: txn?.AuthorizationCode ?? undefined,
    errorCode: txn?.ErrorCode ?? undefined,
    errorDescription: txn?.ErrorDescription ?? undefined,
  };
}

/**
 * Calls the Axerve/GestPay S2S `callPagamS2S` operation.
 *
 * @param params - Payment parameters including card data and shop credentials.
 * @returns Resolved payment result with success/failure status and transaction IDs.
 * @throws {AxerveError} When the SOAP call fails at the network or protocol level.
 *
 * Environment variables:
 * - `AXERVE_USE_MOCK=true` — return a hardcoded success result without any SOAP call.
 * - `AXERVE_SANDBOX=true` — use the sandbox WSDL endpoint URL (default: production).
 *   Note: `AXERVE_SANDBOX` only controls the endpoint URL; it does NOT trigger mock mode.
 */
export async function callPayment(
  params: AxervePaymentParams,
): Promise<AxervePaymentResult> {
  if (process.env.AXERVE_USE_MOCK === "true") {
    // i18n-exempt: developer debug log
    console.info("[axerve-mock] callPayment", {
      shopTransactionId: params.shopTransactionId,
    });
    return {
      success: true,
      transactionId: params.shopTransactionId,
      bankTransactionId: "mock-bank-txn-001",
      authCode: "mock-auth-code",
    };
  }

  // AXERVE_SANDBOX controls endpoint URL only — never triggers mock mode
  const wsdlUrl =
    process.env.AXERVE_SANDBOX === "true" ? SANDBOX_WSDL : PRODUCTION_WSDL;

  const { createClientAsync } = await import("soap");
  const client = await createClientAsync(wsdlUrl);

  let result: unknown;
  try {
    [result] = await (
      client as unknown as {
        callPagamS2SAsync: (p: Record<string, string>) => Promise<unknown[]>;
      }
    ).callPagamS2SAsync({
      shopLogin: params.shopLogin,
      uicCode: params.uicCode,
      amount: params.amount,
      shopTransactionID: params.shopTransactionId,
      cardNumber: params.cardNumber,
      expiryMonth: params.expiryMonth,
      expiryYear: params.expiryYear,
      cvv2: params.cvv,
      buyerName: params.buyerName ?? "",
      buyerEmail: params.buyerEmail ?? "",
    });
  } catch (err) {
    throw new AxerveError(
      `Axerve SOAP call failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return parseS2SResult(result, params.shopTransactionId);
}
