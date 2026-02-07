import "@testing-library/jest-dom";

import { computeSuggestedFixes } from "@/routes/how-to-get-here/computeSuggestedFixes";

describe("computeSuggestedFixes", () => {
  const mockT = ((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key) as any;
  const mockSetDestination = jest.fn();
  const mockSetTransport = jest.fn();
  const mockSetDirection = jest.fn();

  beforeEach(() => {
    mockSetDestination.mockReset();
    mockSetTransport.mockReset();
    mockSetDirection.mockReset();
  });

  it("returns empty array when no active filters", () => {
    const result = computeSuggestedFixes({
      hasActiveFilters: false,
      hasResults: false,
      destinationFilter: "all",
      transportFilter: "all",
      directionFilter: "all",
      t: mockT,
      setDestinationFilter: mockSetDestination,
      setTransportFilter: mockSetTransport,
      setDirectionFilter: mockSetDirection,
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when there are results", () => {
    const result = computeSuggestedFixes({
      hasActiveFilters: true,
      hasResults: true,
      destinationFilter: "naples",
      transportFilter: "all",
      directionFilter: "all",
      t: mockT,
      setDestinationFilter: mockSetDestination,
      setTransportFilter: mockSetTransport,
      setDirectionFilter: mockSetDirection,
    });

    expect(result).toEqual([]);
  });

  it("suggests removing destination filter when set", () => {
    const result = computeSuggestedFixes({
      hasActiveFilters: true,
      hasResults: false,
      destinationFilter: "naples",
      transportFilter: "all",
      directionFilter: "all",
      destinationName: "Naples",
      t: mockT,
      setDestinationFilter: mockSetDestination,
      setTransportFilter: mockSetTransport,
      setDirectionFilter: mockSetDirection,
    });

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Show all destinations");

    result[0].onClick();
    expect(mockSetDestination).toHaveBeenCalledWith("all");
  });

  it("suggests removing transport filter when set", () => {
    const result = computeSuggestedFixes({
      hasActiveFilters: true,
      hasResults: false,
      destinationFilter: "all",
      transportFilter: "ferry",
      directionFilter: "all",
      t: mockT,
      setDestinationFilter: mockSetDestination,
      setTransportFilter: mockSetTransport,
      setDirectionFilter: mockSetDirection,
    });

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Show all transport modes");

    result[0].onClick();
    expect(mockSetTransport).toHaveBeenCalledWith("all");
  });

  it("suggests removing direction filter when set", () => {
    const result = computeSuggestedFixes({
      hasActiveFilters: true,
      hasResults: false,
      destinationFilter: "all",
      transportFilter: "all",
      directionFilter: "to",
      t: mockT,
      setDestinationFilter: mockSetDestination,
      setTransportFilter: mockSetTransport,
      setDirectionFilter: mockSetDirection,
    });

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Show both directions");

    result[0].onClick();
    expect(mockSetDirection).toHaveBeenCalledWith("all");
  });

  it("orders suggestions: destination > transport > direction", () => {
    const result = computeSuggestedFixes({
      hasActiveFilters: true,
      hasResults: false,
      destinationFilter: "naples",
      transportFilter: "ferry",
      directionFilter: "to",
      destinationName: "Naples",
      t: mockT,
      setDestinationFilter: mockSetDestination,
      setTransportFilter: mockSetTransport,
      setDirectionFilter: mockSetDirection,
    });

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe("Show all destinations");
    expect(result[1].label).toBe("Show all transport modes");
    expect(result[2].label).toBe("Show both directions");
  });
});
