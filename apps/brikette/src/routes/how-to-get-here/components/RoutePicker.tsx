import clsx from "clsx";
import { memo, useCallback, useId, useMemo, useState } from "react";
import type { TFunction } from "i18next";

import { getFilterButtonClass } from "../styles";
import { Cluster } from "../ui";

const ROUTE_PICKER_CLASS = [
  "rounded-2xl",
  "border",
  "border-brand-outline/10",
  "bg-brand-surface/85",
  "p-5",
  "shadow-sm",
  "backdrop-blur",
  "dark:border-brand-outline/30",
  "dark:bg-brand-surface/60",
].join(" ");

export type ArrivalWindow = "daytime" | "evening" | "late-night";
export type RoutePreference = "fastest" | "cheapest" | "least-walking" | "luggage-friendly";

export type RoutePickerSelection = {
  placeId: string;
  arrival: ArrivalWindow;
  preference: RoutePreference | null;
};

export type RoutePickerProps = {
  t: TFunction<"howToGetHere">;
  places: Array<{ id: string; name: string }>;
  onSubmit: (selection: RoutePickerSelection) => void;
  className?: string;
};

function RoutePickerBase({ t, places, onSubmit, className }: RoutePickerProps) {
  const placeSelectId = useId();
  const arrivalLegendId = useId();
  const preferenceLegendId = useId();

  const [placeId, setPlaceId] = useState<string>("");
  const [arrival, setArrival] = useState<ArrivalWindow>("evening");
  const [preference, setPreference] = useState<RoutePreference | null>(null);

  const placeOptions = useMemo(() => {
    const list = [...places];
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [places]);

  const submit = useCallback(() => {
    if (!placeId) {
      if (typeof document !== "undefined") {
        const select = document.getElementById(placeSelectId);
        if (select instanceof HTMLSelectElement) {
          select.focus();
        }
      }
      return;
    }

    onSubmit({ placeId, arrival, preference });
  }, [arrival, onSubmit, placeId, placeSelectId, preference]);

  const arrivalChoices: Array<{ key: ArrivalWindow; label: string }> = useMemo(
    () => [
      {
        key: "daytime",
        label: t("routePicker.arrival.daytime", { defaultValue: "Daytime" }),
      },
      {
        key: "evening",
        label: t("routePicker.arrival.evening", { defaultValue: "Evening" }),
      },
      {
        key: "late-night",
        label: t("routePicker.arrival.lateNight", { defaultValue: "Late-night" }),
      },
    ],
    [t],
  );

  const preferenceChoices: Array<{ key: RoutePreference; label: string }> = useMemo(
    () => [
      { key: "fastest", label: t("routePicker.preferences.fastest", { defaultValue: "Fastest" }) },
      { key: "cheapest", label: t("routePicker.preferences.cheapest", { defaultValue: "Cheapest" }) },
      {
        key: "least-walking",
        label: t("routePicker.preferences.leastWalking", { defaultValue: "Least walking" }),
      },
      {
        key: "luggage-friendly",
        label: t("routePicker.preferences.luggageFriendly", { defaultValue: "Most luggage-friendly" }),
      },
    ],
    [t],
  );

  return (
    <section
      aria-label={t("routePicker.title", { defaultValue: "Find the best route" })}
      className={clsx(ROUTE_PICKER_CLASS, className)}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
            {t("routePicker.title", { defaultValue: "Find the best route for your arrival" })}
          </h2>
          <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/70">
            {t("routePicker.subtitle", {
              defaultValue: "Answer two quick questions — we’ll jump you to the best match and highlight it.",
            })}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor={placeSelectId}
              className="text-sm font-semibold text-brand-heading dark:text-brand-surface"
            >
              {t("routePicker.placeLabel", { defaultValue: "Where are you coming from?" })}
            </label>
            <select
              id={placeSelectId}
              value={placeId}
              onChange={(event) => setPlaceId(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-brand-outline/30 bg-brand-surface px-3 py-2 text-base text-brand-heading shadow-sm outline-none transition focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/30 dark:border-brand-outline/40 dark:bg-brand-surface/40 dark:text-brand-surface dark:focus-visible:border-brand-secondary dark:focus-visible:ring-brand-secondary/30"
            >
              <option value="">
                {t("routePicker.placePlaceholder", { defaultValue: "Select a starting point" })}
              </option>
              {placeOptions.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-2">
            <legend
              id={arrivalLegendId}
              className="text-sm font-semibold text-brand-heading dark:text-brand-surface"
            >
              {t("routePicker.arrivalLabel", { defaultValue: "When are you arriving?" })}
            </legend>
            <Cluster as="div" role="radiogroup" aria-labelledby={arrivalLegendId}>
              {arrivalChoices.map(({ key, label }) => {
                const active = arrival === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={getFilterButtonClass(active)}
                    onClick={() => setArrival(key)}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </Cluster>
          </fieldset>
        </div>

        <fieldset className="space-y-2">
          <legend
            id={preferenceLegendId}
            className="text-sm font-semibold text-brand-heading dark:text-brand-surface"
          >
            {t("routePicker.preferencesLabel", { defaultValue: "Preferences" })}
          </legend>
          <Cluster as="div" role="group" aria-labelledby={preferenceLegendId}>
            <button
              type="button"
              className={getFilterButtonClass(preference === null)}
              onClick={() => setPreference(null)}
              aria-pressed={preference === null}
            >
              {t("routePicker.preferences.none", { defaultValue: "No preference" })}
            </button>
            {preferenceChoices.map(({ key, label }) => {
              const active = preference === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={getFilterButtonClass(active)}
                  onClick={() => setPreference(active ? null : key)}
                  aria-pressed={active}
                >
                  {label}
                  </button>
                );
              })}
          </Cluster>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-brand-primary px-5 py-2 text-base font-semibold text-brand-bg shadow-sm transition hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:bg-brand-secondary dark:text-brand-text dark:hover:bg-brand-secondary/90 dark:focus-visible:outline-brand-secondary"
          >
            {t("routePicker.cta", { defaultValue: "Show my best route" })}
          </button>
          <p className="text-sm text-brand-text/70 dark:text-brand-surface/70">
            {t("routePicker.urlHint", {
              defaultValue: "Filters update the URL, so you can share the link.",
            })}
          </p>
        </div>

        {arrival === "late-night" ? (
          <div className="rounded-xl border border-brand-outline/20 bg-brand-secondary/20 px-4 py-3 text-sm text-brand-heading dark:border-brand-outline/40 dark:bg-brand-secondary/20 dark:text-brand-surface">
            {t("routePicker.lateNightHint", {
              defaultValue:
                "Late-night arrivals are often easiest by taxi or shuttle — use the contact options below if buses/ferries are finished.",
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const RoutePicker = memo(RoutePickerBase);
