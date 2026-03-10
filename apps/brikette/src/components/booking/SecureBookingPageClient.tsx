"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type roomsData from "@/data/roomsData";
import { buildSecureBookingDirectUrl, parseSecureBookingSearchParams } from "@/utils/octorateCustomPage";

import OctorateCustomPageShell from "./OctorateCustomPageShell";

type Props = {
  bookingCode: string;
  bookPath: string;
  continueLabel: string;
  fallbackBody: string;
  fallbackTitle: string;
  heading: string;
  loadingText: string;
  readyText: string;
  ratePlanLabels: {
    flex: string;
    nr: string;
  };
  roomLabels: Partial<Record<(typeof roomsData)[number]["id"], string>>;
  securityNote: string;
  stepLabel: string;
  supportingText: string;
  summaryLabels: {
    checkin: string;
    checkout: string;
    guests: string;
    rate: string;
    room: string;
  };
  widgetGlobalKey?: string;
  widgetHostLabel: string;
  widgetScriptSrc?: string;
};

function buildReturnToBookHref(
  pathname: string,
  search: URLSearchParams
): string {
  const params = new URLSearchParams();
  const checkin = search.get("checkin");
  const checkout = search.get("checkout");
  const pax = search.get("pax");
  const deal = search.get("deal");

  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  if (pax) params.set("pax", pax);
  if (deal) params.set("deal", deal);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function SecureBookingPageClient({
  bookingCode,
  bookPath,
  continueLabel,
  fallbackBody,
  fallbackTitle,
  heading,
  loadingText,
  readyText,
  ratePlanLabels,
  roomLabels,
  securityNote,
  stepLabel,
  supportingText,
  summaryLabels,
  widgetGlobalKey,
  widgetHostLabel,
  widgetScriptSrc,
}: Props): JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runtimeSearchParams = new URLSearchParams(searchParams.toString());
  const fallbackBookHref = buildReturnToBookHref(bookPath, runtimeSearchParams);
  const query = parseSecureBookingSearchParams(runtimeSearchParams);
  const directResult = query ? buildSecureBookingDirectUrl(query, bookingCode) : null;

  useEffect(() => {
    if (!query || !directResult?.ok) {
      router.replace(fallbackBookHref);
    }
  }, [directResult, fallbackBookHref, query, router]);

  if (!query || !directResult?.ok) {
    return null;
  }

  const roomName =
    roomLabels[query.room.id] ??
    query.room.id.replace(/_/gu, " ");

  return (
    <OctorateCustomPageShell
      continueLabel={continueLabel}
      directUrl={directResult.url}
      fallbackBody={fallbackBody}
      fallbackTitle={fallbackTitle}
      heading={heading}
      loadingText={loadingText}
      readyText={readyText}
      securityNote={securityNote}
      stepLabel={stepLabel}
      supportingText={supportingText}
      summary={{
        checkin: query.checkin,
        checkout: query.checkout,
        pax: query.pax,
        ratePlanLabel: ratePlanLabels[query.plan],
        roomName,
      }}
      summaryLabels={summaryLabels}
      widgetGlobalKey={widgetGlobalKey}
      widgetHostLabel={widgetHostLabel}
      widgetScriptSrc={widgetScriptSrc}
    />
  );
}
