import "server-only";

const SANDBOX_WSDL =
  "https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL";
const PRODUCTION_WSDL =
  "https://ecomms2s.sella.it/gestpay/gestpayws/WSs2s.asmx?WSDL";

export interface AxervePaymentParams {
  shopLogin: string;
  apiKey: string;
  uicCode: string; // "978" for EUR (ISO 4217 numeric code)
  amount: string; // e.g. "10.00"
  shopTransactionId: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  buyerName?: string;
  buyerEmail?: string;
}

export interface AxervePaymentResult {
  success: boolean;
  transactionId: string;
  bankTransactionId: string;
  authCode?: string;
  errorCode?: string;
  errorDescription?: string;
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

  // SPIKE stub: load SOAP client from WSDL
  // Full error handling (AxerveError) added in IMPLEMENT-03
  const { createClientAsync } = await import("soap");
  const client = await createClientAsync(wsdlUrl);

  const [result] = await (
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

  return parseS2SResult(result, params.shopTransactionId);
}
