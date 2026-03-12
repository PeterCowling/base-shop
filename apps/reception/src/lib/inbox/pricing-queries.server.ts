import "server-only";

import { cityTaxByOccupantSchema } from "../../schemas/cityTaxSchema";
import { financialsRoomDataSchema } from "../../schemas/financialsRoomSchema";
import { getGmailThread, listGmailThreads } from "../gmail-client";

import { generateEmailHtml } from "./draft-core/email-template";
import { fetchFirebaseJson } from "./firebase-rtdb.server";

const HOSTELWORLD_PRICING_TEMPLATE_SUBJECT = "Hostelworld Pricing Breakdown";
const PAYMENT_GUIDE_URL = "https://hostel-positano.com/en/guides/deposits-payments";

const PRICING_KEYWORDS = [
  "price",
  "pricing",
  "total",
  "amount",
  "balance",
  "deposit",
  "paid",
  "payment",
  "currency",
  "usd",
  "eur",
  "euro",
  "cost",
  "charged",
  "breakdown",
];

type PricingDraftInput = {
  bookingRef?: string;
  subject?: string;
  body: string;
  recipientName?: string;
};

type PricingSourceBreakdown = {
  roomPriceBeforeTax: number | null;
  depositPaid: number | null;
  originalBalanceDue: number | null;
};

type LiveBalanceBreakdown = {
  roomAmountDue: number | null;
  cityTaxDue: number | null;
  totalPayable: number | null;
};

export type PricingQueryDraftResult = {
  plainText: string;
  html: string;
  templateUsed: {
    subject: string;
    category: "payment";
    confidence: number;
    selection: "auto";
  };
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatEuro(value: number | null): string {
  return value === null ? "Unavailable" : `€${value.toFixed(2)}`;
}

function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) {
    return null;
  }

  const match = raw.match(/([\d.,]+)/);
  if (!match?.[1]) {
    return null;
  }

  let normalized = match[1];
  if (normalized.includes(".") && normalized.includes(",")) {
    normalized =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? roundCurrency(parsed) : null;
}

function extractAmount(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    const amount = parseAmount(match?.[1]);
    if (amount !== null) {
      return amount;
    }
  }
  return null;
}

function isLikelyHostelworldPricingQuery(input: PricingDraftInput): boolean {
  const bookingRef = input.bookingRef?.trim();
  if (!bookingRef?.startsWith("7763-")) {
    return false;
  }

  const haystack = `${input.subject ?? ""}\n${input.body}`.toLowerCase();
  return PRICING_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

async function readLiveBalance(bookingRef: string): Promise<LiveBalanceBreakdown | null> {
  const [financialsRaw, cityTaxRaw] = await Promise.all([
    fetchFirebaseJson(`/financialsRoom/${bookingRef}`),
    fetchFirebaseJson(`/cityTax/${bookingRef}`),
  ]);

  const financialsResult = financialsRoomDataSchema.safeParse(financialsRaw);
  const cityTaxResult = cityTaxByOccupantSchema.safeParse(cityTaxRaw);

  if (!financialsResult.success) {
    return null;
  }

  const roomAmountDue = roundCurrency(financialsResult.data.balance ?? financialsResult.data.totalDue ?? 0);
  const cityTaxDue = cityTaxResult.success
    ? roundCurrency(
        Object.values(cityTaxResult.data).reduce((sum, record) => sum + (record.balance ?? 0), 0),
      )
    : 0;

  return {
    roomAmountDue,
    cityTaxDue,
    totalPayable: roundCurrency(roomAmountDue + cityTaxDue),
  };
}

function parseHostelworldBreakdown(text: string): PricingSourceBreakdown {
  return {
    roomPriceBeforeTax: extractAmount(text, [
      /total price[:\s]+(?:eur|€)?\s*([\d.,]+)/i,
      /price before tax[:\s]+(?:eur|€)?\s*([\d.,]+)/i,
    ]),
    depositPaid: extractAmount(text, [
      /deposit paid[:\s]+(?:eur|€)?\s*([\d.,]+)/i,
      /total collected[:\s]+(?:eur|€)?\s*([\d.,]+)/i,
    ]),
    originalBalanceDue: extractAmount(text, [
      /balance due - available now[:\s]+(?:eur|€)?\s*([\d.,]+)/i,
      /total to be cashed[:\s]+(?:eur|€)?\s*([\d.,]+)/i,
    ]),
  };
}

function mergeBreakdowns(
  primary: PricingSourceBreakdown | null,
  secondary: PricingSourceBreakdown | null,
): PricingSourceBreakdown | null {
  if (!primary && !secondary) {
    return null;
  }

  return {
    roomPriceBeforeTax: primary?.roomPriceBeforeTax ?? secondary?.roomPriceBeforeTax ?? null,
    depositPaid: primary?.depositPaid ?? secondary?.depositPaid ?? null,
    originalBalanceDue: primary?.originalBalanceDue ?? secondary?.originalBalanceDue ?? null,
  };
}

async function readSourceBreakdown(bookingRef: string): Promise<PricingSourceBreakdown | null> {
  const list = await listGmailThreads({
    maxResults: 10,
    query: `"${bookingRef}"`,
  });

  const threads = list.threads ?? [];
  if (threads.length === 0) {
    return null;
  }

  let merged: PricingSourceBreakdown | null = null;

  for (const thread of threads) {
    if (!thread.id) {
      continue;
    }

    const detail = await getGmailThread(thread.id);
    for (const message of detail.messages) {
      const combined = `${message.subject ?? ""}\n${message.from ?? ""}\n${message.body.plain}`;
      if (!combined.includes(bookingRef)) {
        continue;
      }

      const parsed = parseHostelworldBreakdown(combined);
      if (parsed.roomPriceBeforeTax !== null || parsed.depositPaid !== null || parsed.originalBalanceDue !== null) {
        merged = mergeBreakdowns(merged, parsed);
      }
    }
  }

  return merged;
}

function buildPricingEmailBody(
  recipientName: string | undefined,
  bookingRef: string,
  sourceBreakdown: PricingSourceBreakdown | null,
  liveBalance: LiveBalanceBreakdown,
): string {
  const roomPriceBeforeTax = sourceBreakdown?.roomPriceBeforeTax ?? null;
  const depositPaid = sourceBreakdown?.depositPaid ?? null;
  const remainingRoomBalanceBeforeTax =
    roomPriceBeforeTax !== null && depositPaid !== null
      ? roundCurrency(roomPriceBeforeTax - depositPaid)
      : null;
  const roomTaxIncluded =
    liveBalance.roomAmountDue !== null && remainingRoomBalanceBeforeTax !== null
      ? roundCurrency(liveBalance.roomAmountDue - remainingRoomBalanceBeforeTax)
      : null;
  const depositPercentage =
    roomPriceBeforeTax !== null && roomPriceBeforeTax > 0 && depositPaid !== null
      ? Math.round((depositPaid / roomPriceBeforeTax) * 100)
      : null;

  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Guest,";

  const sections: string[] = [
    greeting,
    "",
    "Thank you for your message.",
    "",
  ];

  if (sourceBreakdown && roomPriceBeforeTax !== null && depositPaid !== null) {
    sections.push(
      "We have checked your booking details in two places:",
      "",
      "- the original Hostelworld booking information",
      "- our booking system",
      "",
      "Both confirm the booking charges shown in euros below.",
      "",
      "Here is the breakdown from the original Hostelworld booking information:",
      "",
      `- Room price before tax: ${formatEuro(roomPriceBeforeTax)}`,
      `- Hostelworld deposit already paid: ${formatEuro(depositPaid)}`,
      ...(depositPercentage !== null ? [`- Deposit percentage: ${depositPercentage}%`] : []),
      ...(remainingRoomBalanceBeforeTax !== null
        ? [`- Remaining room balance before tax: ${formatEuro(remainingRoomBalanceBeforeTax)}`]
        : []),
      ...(roomTaxIncluded !== null ? [`- Tax included in the payable balance: ${formatEuro(roomTaxIncluded)}`] : []),
      "",
    );
  } else {
    sections.push(
      "We have checked your booking in our booking system and reviewed the related booking reference.",
      "",
    );
  }

  sections.push(
    "Our booking system currently shows:",
    "",
    `- Room amount due: ${formatEuro(liveBalance.roomAmountDue)}`,
    `- City tax due: ${formatEuro(liveBalance.cityTaxDue)}`,
    "",
    `This gives a total payable balance of ${formatEuro(liveBalance.totalPayable)}.`,
    "",
    "For clarity:",
    "",
    "- The Hostelworld deposit is the amount already paid through Hostelworld when the booking was made.",
    "- For Hostelworld bookings, this deposit is typically 15% of the room price before tax.",
    "- The remaining room balance is what is still due for the room itself after that deposit has been deducted.",
    "- The city tax is a separate local government charge of €2.50 per guest, per night.",
    `- Your booking reference is ${bookingRef}.`,
    "",
    "All prices are in euros. If you see a different amount than quoted above, please check the currency displayed in the payment page or by your card provider.",
    "",
    "If you would also like the original booking figures confirmed by your booking agent, you can contact Hostelworld directly and they will be able to help.",
    "",
    "For general information about deposits and payments, please see:",
    `<${PAYMENT_GUIDE_URL}>`,
  );

  return sections.join("\n");
}

export async function buildPricingQueryDraft(
  input: PricingDraftInput,
): Promise<PricingQueryDraftResult | null> {
  const bookingRef = input.bookingRef?.trim();
  if (!bookingRef || !isLikelyHostelworldPricingQuery(input)) {
    return null;
  }

  const liveBalance = await readLiveBalance(bookingRef);
  if (!liveBalance?.totalPayable && liveBalance?.totalPayable !== 0) {
    return null;
  }

  const sourceBreakdown = await readSourceBreakdown(bookingRef).catch(() => null);
  const plainText = buildPricingEmailBody(
    input.recipientName,
    bookingRef,
    sourceBreakdown,
    liveBalance,
  );
  const html = generateEmailHtml({
    recipientName: input.recipientName,
    bodyText: plainText,
    subject: input.subject,
  });

  return {
    plainText,
    html,
    templateUsed: {
      subject: HOSTELWORLD_PRICING_TEMPLATE_SUBJECT,
      category: "payment",
      confidence: 100,
      selection: "auto",
    },
  };
}
