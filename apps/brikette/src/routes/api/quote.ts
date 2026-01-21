// src/routes/api/quote.ts
import type { LoaderFunctionArgs } from "react-router-dom";

import roomsData from "@/data/roomsData";
import { cityTaxFor,findNightlyPrices, listNights } from "@/lib/rates";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sku = url.searchParams.get("sku");
  const checkin = url.searchParams.get("checkin");
  const checkout = url.searchParams.get("checkout");
  const plan = (url.searchParams.get("plan") ?? "flex") as "flex" | "nr";

  if (!sku || !checkin || !checkout) {
    // i18n-exempt -- OPS-101 [ttl=2026-12-31] Non‑UI API error message
    return Response.json({ error: "Missing sku, checkin or checkout" }, { status: 400 });
  }

  const room = roomsData.find((r) => r.sku === sku);
  if (!room) {
    // i18n-exempt -- OPS-101 [ttl=2026-12-31] Non‑UI API error message
    return Response.json({ error: "Unknown sku" }, { status: 404 });
  }

  const nights = listNights(checkin, checkout);
  const { prices, allAvailable } = findNightlyPrices(sku, plan, nights);
  const nightsCount = nights.length;

  // Effective adults mapping as in the booking page
  const effectiveAdults = room.pricingModel === "perRoom" ? 2 : 1;
  const multiplier = room.pricingModel === "perRoom" ? 1 : effectiveAdults;
  const totalBeforeTax = prices.reduce((sum, p) => sum + p, 0) * multiplier;
  const cityTax = cityTaxFor(effectiveAdults, nightsCount);
  const total = totalBeforeTax + cityTax;

  return Response.json({
    sku,
    plan,
    nights: nightsCount,
    nightly: prices,
    totalBeforeTax,
    cityTax,
    total,
    available: allAvailable,
    currency: "EUR",
  });
}
