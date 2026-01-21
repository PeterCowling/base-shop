"use client";

// src/app/[lang]/book/BookPageContent.tsx
// Client component for book page - migrated from routes/book.tsx
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Section } from "@acme/ui/atoms/Section";

import roomsData from "@/data/roomsData";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { getSlug } from "@/utils/slug";

type Props = {
  lang: AppLanguage;
};

function parseIntSafe(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isPerRoom(sku: string): boolean {
  const room = roomsData.find((r) => r.sku === sku);
  return room?.pricingModel === "perRoom";
}

function defaultAdultsForSku(sku?: string | null): number {
  if (sku && isPerRoom(sku)) return 2; // private double defaults to 2
  return 1; // dorms default to single-occupancy pricing
}

function buildOctorateLink(
  checkin: string,
  checkout: string,
  _adults: number,
  children: number | undefined,
  passthroughUtms: URLSearchParams
): string {
  const base = "https://book.octorate.com/octobook/site/reservation/result.xhtml";
  const params = new URLSearchParams();
  params.set("codice", "45111");
  params.set("checkin", checkin);
  params.set("checkout", checkout);
  params.set("pax", "1"); // Always pax=1 per spec
  if (children && children > 0) params.set("children", String(children));
  // tracking: pass through any utm_* present on our URL; otherwise default to site CTA
  const hasIncomingUtms = Array.from(passthroughUtms.keys()).some((k) => k.startsWith("utm_"));
  if (hasIncomingUtms) {
    for (const [k, v] of passthroughUtms.entries()) {
      if (k.startsWith("utm_")) params.set(k, v);
    }
  } else {
    params.set("utm_source", "site");
    params.set("utm_medium", "cta");
    params.set("utm_campaign", "direct_booking");
  }
  return `${base}?${params.toString()}`;
}

function BookPageContent({ lang }: Props) {
  const { t } = useTranslation("bookPage", { lng: lang });
  const searchParams = useSearchParams();
  const [unavailableFor, setUnavailableFor] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<
    null | { items: { sku: string; plan: "flex" | "nr"; confirmUrl: string }[]; resultUrl: string }
  >(null);
  const [pending, setPending] = useState<string | null>(null);

  // Preload namespaces
  useEffect(() => {
    const loadNamespaces = async () => {
      await preloadNamespacesWithFallback(lang, ["bookPage", "translation"]);
      await i18n.changeLanguage(lang);
    };
    void loadNamespaces();
  }, [lang]);

  const checkin = searchParams?.get("checkin") ?? getTodayIso();
  const checkout = searchParams?.get("checkout") ?? getDatePlusTwoDays(checkin);
  const sku = searchParams?.get("sku") ?? null;
  const adults = parseIntSafe(searchParams?.get("adults") ?? null, defaultAdultsForSku(sku));
  const children = parseIntSafe(searchParams?.get("children") ?? null, 0);

  const octorateHref = useMemo(
    () => buildOctorateLink(checkin, checkout, adults, children, searchParams ?? new URLSearchParams()),
    [checkin, checkout, adults, children, searchParams]
  );

  const orderedRooms = useMemo(() => {
    const list = [...roomsData];
    if (sku) {
      list.sort((a, b) => (a.sku === sku ? -1 : b.sku === sku ? 1 : 0));
    }
    return list;
  }, [sku]);

  const handleConfirmClick = useCallback(
    async (
      roomSku: string,
      plan: "flex" | "nr",
      ev: React.MouseEvent<HTMLAnchorElement>
    ) => {
      ev.preventDefault();
      setPending(`${roomSku}:${plan}`);
      setUnavailableFor(null);
      setAlternatives(null);

      // Build query for our API
      const params = new URLSearchParams();
      params.set("sku", roomSku);
      params.set("plan", plan);
      params.set("checkin", checkin);
      params.set("checkout", checkout);
      // Pass through children/ages and UTMs if present
      const childrenStr = searchParams?.get("children");
      const childrenAges = searchParams?.get("childrenAges");
      if (childrenStr) params.set("children", childrenStr);
      if (childrenAges) params.set("childrenAges", childrenAges);
      if (searchParams) {
        for (const [k, v] of searchParams.entries()) {
          if (k.startsWith("utm_")) params.set(k, v);
        }
      }

      try {
        const res = await fetch(`/api/octorate/confirm-link?${params.toString()}`);
        const data = await res.json();
        // Fire GA4 begin_checkout if present
        const win = window as unknown as { gtag?: (...args: unknown[]) => void };
        if (typeof win.gtag === "function" && data?.confirmUrl) {
          win.gtag("event", "begin_checkout", {
            currency: "EUR",
            items: [{ item_id: roomSku, item_name: roomSku, item_category: plan }],
          });
        }
        if (data.status === "available" && data.confirmUrl) {
          window.location.assign(data.confirmUrl as string);
          return;
        }
        // Unavailable or fallback/error → show alternatives
        const altParams = new URLSearchParams();
        altParams.set("checkin", checkin);
        altParams.set("checkout", checkout);
        altParams.set("excludeSku", roomSku);
        altParams.set("plan", plan);
        if (childrenStr) altParams.set("children", childrenStr);
        if (childrenAges) altParams.set("childrenAges", childrenAges);
        if (searchParams) {
          for (const [k, v] of searchParams.entries()) {
            if (k.startsWith("utm_")) altParams.set(k, v);
          }
        }
        const altRes = await fetch(`/api/octorate/alternatives?${altParams.toString()}`);
        const altData = await altRes.json();
        setUnavailableFor(roomSku);
        setAlternatives({ items: altData.alternatives || [], resultUrl: altData.resultUrl || octorateHref });
      } catch {
        setUnavailableFor(roomSku);
        setAlternatives({ items: [], resultUrl: octorateHref });
      } finally {
        setPending(null);
      }
    },
    [checkin, checkout, octorateHref, searchParams]
  );

  return (
    <Section padding="default" className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-semibold">{t("heading")}</h1>
      <p className="text-sm text-brand-text/80">
        {checkin} → {checkout}
      </p>

      <div className="mt-6 space-y-6">
        {orderedRooms.map((room) => {
          return (
            <section key={room.sku} className="rounded-lg border border-brand-outline/40 bg-brand-bg p-4 shadow-sm dark:bg-brand-text">
              <h2 className="text-lg font-semibold">{room.id.replace(/_/g, " ")}</h2>
              <p className="mt-1 text-sm text-brand-text/80">{t("roomLabel")}</p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-brand-outline/30 p-4">
                  <h3 className="font-medium">{t("flex.title")}</h3>
                  <ul className="mt-2 text-sm list-disc pl-5 text-brand-text/80">
                    <li>{t("flex.bullets.0")}</li>
                    <li>{t("flex.bullets.1")}</li>
                  </ul>
                  <div className="mt-3">
                    <a
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-brand-primary px-4 py-2 text-brand-bg hover:opacity-90"
                      href={octorateHref}
                      onClick={(e) => handleConfirmClick(room.sku, "flex", e)}
                    >
                      {pending === `${room.sku}:flex` ? t("checking") : t("cta.flex")}
                    </a>
                  </div>
                </div>

                <div className="rounded-md border border-brand-outline/30 p-4">
                  <h3 className="font-medium">{t("nr.title")}</h3>
                  <ul className="mt-2 text-sm list-disc pl-5 text-brand-text/80">
                    <li>{t("nr.bullets.0")}</li>
                    <li>{t("nr.bullets.1")}</li>
                  </ul>
                  <div className="mt-3">
                    <a
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-brand-secondary px-4 py-2 text-brand-heading hover:opacity-90"
                      href={octorateHref}
                      onClick={(e) => handleConfirmClick(room.sku, "nr", e)}
                    >
                      {pending === `${room.sku}:nr` ? t("checking") : t("cta.nr")}
                    </a>
                  </div>
                </div>
              </div>

              {unavailableFor === room.sku && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
                  <p className="font-medium text-red-800">{t("unavailable.title")}</p>
                  {alternatives?.items?.length ? (
                    <div className="mt-2 space-y-2">
                      {alternatives.items.map((alt) => (
                        <div key={`${alt.sku}:${alt.plan}`} className="flex items-center justify-between rounded border border-brand-outline/20 bg-brand-bg p-3 text-sm">
                          <div>
                            <div className="font-semibold">{alt.sku.replace(/_/g, " ")}</div>
                            <div className="text-brand-text/70">{alt.plan === "flex" ? t("flex.title") : t("nr.title")}</div>
                          </div>
                          <a className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-brand-primary px-4 py-2 text-brand-bg" href={alt.confirmUrl} rel="noopener noreferrer">
                            {t("unavailable.bookThis")}
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-brand-text/80">{t("unavailable.none")}</p>
                  )}
                  <div className="mt-3">
                    <a className="inline-flex min-h-11 min-w-11 items-center text-sm underline" href={alternatives?.resultUrl ?? octorateHref} rel="noopener noreferrer">
                      {t("unavailable.seeAll")}
                    </a>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-8 rounded-md border border-brand-outline/30 bg-brand-bg p-4 text-sm text-brand-text/80 dark:bg-brand-text">
        <h3 className="font-medium text-brand-heading">{t("policies.title")}</h3>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>{t("policies.items.0")}</li>
          <li>{t("policies.items.1")}</li>
          <li>{t("policies.items.2")}</li>
          <li>{t("policies.items.3")}</li>
          <li>{t("policies.items.4")}</li>
        </ul>
        <p className="mt-2 text-xs">{t("policies.footer")}</p>
      </div>

      <div className="mt-6 text-sm">
        <Link href={`/${lang}/${getSlug("rooms", lang)}`} prefetch={true} className="inline-flex min-h-10 min-w-10 items-center underline">
          {t("backToRooms")}
        </Link>
      </div>
    </Section>
  );
}

export default memo(BookPageContent);
