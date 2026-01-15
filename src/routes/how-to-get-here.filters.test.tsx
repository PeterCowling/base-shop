import {
  appendRomeDestination,
  buildActiveFiltersList,
  createDestinationSelectHandler,
} from "./how-to-get-here";
import type { DestinationFiltersState } from "./how-to-get-here/useDestinationFilters";
import type { DestinationFilter } from "./how-to-get-here/types";
import { describe, expect, it, vi } from "vitest";
import type { TFunction } from "i18next";

const baseFilters = (): DestinationFiltersState => ({
  transportFilter: "all",
  directionFilter: "all",
  destinationFilter: "all",
  setTransportFilter: vi.fn(),
  setDirectionFilter: vi.fn(),
  setDestinationFilter: vi.fn(),
  availableTransportModes: ["bus"],
  availableDirections: ["to"],
  availableDestinations: [{ id: "salerno", name: "Salerno" }],
  filteredSections: [],
  hasActiveFilters: false,
  clearFilters: vi.fn(),
  totalRoutes: 4,
});

describe("How-to-get-here filters helpers", () => {
  it("appends the Rome destination option and resets filters after scrolling into view", () => {
    const destinations = appendRomeDestination([{ id: "salerno", name: "Salerno" }], "Rome Planner");
    expect(destinations).toEqual([
      { id: "salerno", name: "Salerno" },
      { id: "rome", name: "Rome Planner" },
    ]);

    const romeSection = document.createElement("section");
    romeSection.id = "rome-travel-planner";
    romeSection.scrollIntoView = vi.fn();
    const focusSpy = vi.spyOn(romeSection, "focus").mockImplementation(() => {});
    document.body.appendChild(romeSection);

    const setDestinationFilter = vi.fn();
    const handleSelect = createDestinationSelectHandler(setDestinationFilter, romeSection.id, document);
    handleSelect("rome" as DestinationFilter);

    expect(setDestinationFilter).toHaveBeenCalledWith("all");
    expect(romeSection.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    handleSelect("salerno");
    expect(setDestinationFilter).toHaveBeenCalledWith("salerno");

    focusSpy.mockRestore();
    romeSection.remove();
  });

  it("surfaces active filters for destination, direction, and transport selections", () => {
    const filters = baseFilters();
    filters.transportFilter = "bus";
    filters.directionFilter = "to";
    filters.destinationFilter = "salerno";

    const destinations = appendRomeDestination(filters.availableDestinations, "Rome Planner");
    const t = vi.fn((key: string) => key) as unknown as TFunction;

    const activeFilters = buildActiveFiltersList(filters, destinations, "Destination", t);

    expect(activeFilters).toEqual([
      { label: "filters.transportLabel", value: "filters.transportModes.bus" },
      { label: "filters.directionLabel", value: "filters.directionTo" },
      { label: "Destination", value: "Salerno" },
    ]);
  });
});