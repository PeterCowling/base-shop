import type { TFunction } from "i18next";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/design-system/primitives";

import { clearFiltersButtonClass, getFilterButtonClass } from "../styles";
import { TRANSPORT_MODE_ICONS } from "../transport";
import type { DestinationFilter, DirectionFilter, RouteDirection, TransportFilter } from "../types";
import { Cluster, Stack } from "../ui";
import type { DestinationFiltersState } from "../useDestinationFilters";

type FiltersState = Pick<
  DestinationFiltersState,
  | "transportFilter"
  | "directionFilter"
  | "destinationFilter"
  | "setTransportFilter"
  | "setDirectionFilter"
  | "setDestinationFilter"
  | "availableTransportModes"
  | "availableDirections"
  | "availableDestinations"
  | "hasActiveFilters"
  | "clearFilters"
>;

export type FiltersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: TFunction<"howToGetHere">;
  destinationFilterLabel: string;
  destinationFilterAllLabel: string;
  filtersHelper?: string;
  filters: FiltersState;
};

export function FiltersDialog({
  open,
  onOpenChange,
  t,
  destinationFilterLabel,
  destinationFilterAllLabel,
  filtersHelper,
  filters,
}: FiltersDialogProps) {
  const {
    transportFilter,
    directionFilter,
    destinationFilter,
    setTransportFilter,
    setDirectionFilter,
    setDestinationFilter,
    availableTransportModes,
    availableDirections,
    availableDestinations,
    hasActiveFilters,
    clearFilters,
  } = filters;

  const title = t("filters.dialog.title", { defaultValue: "Filter routes" });
  const description = t("filters.dialog.description", {
    defaultValue: "Use filters to narrow down the list. Links stay shareable via the URL.",
  });

  const toggleTransport = (mode: TransportFilter) => {
    setTransportFilter(transportFilter === mode ? "all" : mode);
  };

  const toggleDirection = (direction: DirectionFilter) => {
    setDirectionFilter(directionFilter === direction ? "all" : direction);
  };

  const toggleDestination = (id: DestinationFilter) => {
    setDestinationFilter(destinationFilter === id ? "all" : id);
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-auto bottom-0 start-0 end-0 -translate-x-0 -translate-y-0 rounded-t-3xl sm:top-1/2 sm:bottom-auto sm:start-1/2 sm:end-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl max-h-dvh overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {filtersHelper ? filtersHelper : description}
          </DialogDescription>
        </DialogHeader>

        <Stack className="gap-6">
          <fieldset className="min-w-0">
            <legend className="tracking-eyebrow text-sm font-semibold uppercase text-brand-secondary">
              {destinationFilterLabel}
            </legend>
            <Cluster as="ul" className="mt-3">
              <li>
                <button
                  type="button"
                  className={getFilterButtonClass(destinationFilter === "all")}
                  onClick={() => setDestinationFilter("all")}
                  aria-pressed={destinationFilter === "all"}
                >
                  {destinationFilterAllLabel}
                </button>
              </li>
              {availableDestinations.map(({ id, name }) => {
                const isActive = destinationFilter === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={getFilterButtonClass(isActive)}
                      onClick={() => toggleDestination(id)}
                      aria-pressed={isActive}
                    >
                      {name}
                    </button>
                  </li>
                );
              })}
            </Cluster>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="tracking-eyebrow text-sm font-semibold uppercase text-brand-secondary">
              {t("filters.transportLabel")}
            </legend>
            <Cluster as="ul" className="mt-3">
              <li>
                <button
                  type="button"
                  className={getFilterButtonClass(transportFilter === "all")}
                  onClick={() => setTransportFilter("all")}
                  aria-pressed={transportFilter === "all"}
                >
                  {t("filters.transportAll")}
                </button>
              </li>
              {availableTransportModes.map((mode) => {
                const isActive = transportFilter === mode;
                const Icon = TRANSPORT_MODE_ICONS[mode];
                return (
                  <li key={mode}>
                    <button
                      type="button"
                      className={getFilterButtonClass(isActive)}
                      onClick={() => toggleTransport(mode)}
                      aria-pressed={isActive}
                    >
                      {Icon ? <Icon aria-hidden className="size-4" /> : null}
                      <span>{t(`filters.transportModes.${mode}`)}</span>
                    </button>
                  </li>
                );
              })}
            </Cluster>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="tracking-eyebrow text-sm font-semibold uppercase text-brand-secondary">
              {t("filters.directionLabel")}
            </legend>
            <Cluster as="ul" className="mt-3">
              <li>
                <button
                  type="button"
                  className={getFilterButtonClass(directionFilter === "all")}
                  onClick={() => setDirectionFilter("all")}
                  aria-pressed={directionFilter === "all"}
                >
                  {t("filters.directionAll")}
                </button>
              </li>
              {availableDirections.map((direction: RouteDirection) => {
                const isActive = directionFilter === direction;
                return (
                  <li key={direction}>
                    <button
                      type="button"
                      className={getFilterButtonClass(isActive)}
                      onClick={() => toggleDirection(direction)}
                      aria-pressed={isActive}
                    >
                      {direction === "to" ? t("filters.directionTo") : t("filters.directionFrom")}
                    </button>
                  </li>
                );
              })}
            </Cluster>
          </fieldset>
        </Stack>

        <DialogFooter className="gap-3 sm:gap-2">
          {hasActiveFilters ? (
            <button type="button" className={clearFiltersButtonClass} onClick={clearFilters}>
              {t("filters.clearLabel")}
            </button>
          ) : null}
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            color="primary"
            tone="solid"
            className="rounded-xl"
          >
            {t("filters.dialog.done", { defaultValue: "Done" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
